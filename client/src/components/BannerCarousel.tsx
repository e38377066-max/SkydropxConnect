import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PromotionalBanner = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: string;
  displayOrder: string;
};

export default function BannerCarousel() {
  const { data } = useQuery<{ success: boolean; data: PromotionalBanner[] }>({
    queryKey: ['/api/banners/active'],
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'center' },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const banners = data?.data || [];

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full" data-testid="banner-carousel">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%] min-w-0 relative">
              {banner.linkUrl ? (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  data-testid={`banner-link-${banner.id}`}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-48 sm:h-64 md:h-80 object-cover"
                    data-testid={`banner-image-${banner.id}`}
                  />
                </a>
              ) : (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-48 sm:h-64 md:h-80 object-cover"
                  data-testid={`banner-image-${banner.id}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={scrollPrev}
            data-testid="banner-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={scrollNext}
            data-testid="banner-next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}
