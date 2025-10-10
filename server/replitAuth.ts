import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitterStrategy } from "@superfaceai/passport-twitter-oauth2";
import bcrypt from "bcrypt";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy for email/password authentication
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user || !user.password) {
          return done(null, false, { message: 'Email o contraseña incorrectos' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Email o contraseña incorrectos' });
        }

        // For local auth, create a simpler session structure
        return done(null, {
          id: user.id,
          email: user.email,
          isLocal: true
        });
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth strategy - use dynamic callback based on request
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: '/api/auth/google/callback', // Relative URL - will use the actual domain
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const email = profile.emails?.[0]?.value;
        const googleId = profile.id; // Google's unique ID
        const firstName = profile.name?.givenName || profile.displayName;
        const lastName = profile.name?.familyName || '';
        const profileImageUrl = profile.photos?.[0]?.value;

        if (!email) {
          return done(new Error('No email found in Google profile'));
        }

        // Check if user exists
        let user = await storage.getUserByEmail(email);

        if (!user) {
          // Create new user with Google ID
          user = await storage.createUser({
            email,
            googleId,
            firstName,
            lastName,
            profileImageUrl,
            password: null, // Google users don't need passwords initially
          });
        } else {
          // Update user info from Google and link Google ID
          await storage.updateUser(user.id, {
            googleId,
            firstName,
            lastName,
            profileImageUrl,
          });
        }

        // Return user for session
        return done(null, {
          id: user.id,
          email: user.email,
          isGoogle: true
        });
      } catch (error) {
        return done(error as Error);
      }
    }
  ));

  // Twitter/X OAuth 2.0 strategy (optional - only if credentials are configured)
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    passport.use(new TwitterStrategy(
      {
        clientType: 'confidential',
        clientID: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: '/api/auth/twitter/callback',
        scope: ['tweet.read', 'users.read', 'offline.access']
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          // Extract user info from Twitter profile
          const twitterId = profile.id;
          const username = profile.username;
          const displayName = profile.displayName || profile.name;
          const profileImageUrl = profile.photos?.[0]?.value || profile.profile_image_url;
          
          // Twitter doesn't always provide email, use username as fallback identifier
          const email = profile.emails?.[0]?.value || `${username}@twitter.placeholder.com`;
          
          // Check if user exists by twitterId first
          let user = await storage.getUserByTwitterId(twitterId);
          
          if (!user && profile.emails?.[0]?.value) {
            // If no user by twitterId, check by real email
            user = await storage.getUserByEmail(profile.emails[0].value);
          }

          if (!user) {
            // Create new user with Twitter ID
            user = await storage.createUser({
              email,
              twitterId,
              firstName: displayName,
              lastName: '',
              profileImageUrl,
              password: null,
            });
          } else {
            // Update user info from Twitter and link Twitter ID
            await storage.updateUser(user.id, {
              twitterId,
              firstName: displayName,
              profileImageUrl,
            });
          }

          // Return user for session
          return done(null, {
            id: user.id,
            email: user.email,
            isTwitter: true
          });
        } catch (error) {
          return done(error as Error);
        }
      }
    ));
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  for (const domain of process.env
    .REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google OAuth login route
  app.get("/api/login-google", passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  // Google OAuth callback route
  app.get("/api/auth/google/callback", 
    passport.authenticate('google', { 
      failureRedirect: '/auth',
      successRedirect: '/'
    })
  );

  // Twitter/X OAuth login route
  app.get("/api/login-twitter", passport.authenticate('twitter', {
    scope: ['tweet.read', 'users.read', 'offline.access']
  }));

  // Twitter/X OAuth callback route
  app.get("/api/auth/twitter/callback", 
    passport.authenticate('twitter', { 
      failureRedirect: '/auth',
      successRedirect: '/'
    })
  );

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user as any;

  // If local, Google, or Twitter authentication, just verify the session exists
  if (user.isLocal || user.isGoogle || user.isTwitter) {
    return next();
  }

  // Replit Auth OAuth - check token expiration
  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
