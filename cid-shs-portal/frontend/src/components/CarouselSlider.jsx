import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllCarouselSlides } from '../services/carousel';
import { resolveFileUrl } from '../services/api';

/**
 * CarouselSlider - Hero carousel with automatic rotation
 * Displays latest news, achievements, and announcements from the database
 */
export function CarouselSlider() {
  const [slides, setSlides] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    const loadSlides = async () => {
      try {
        const data = await getAllCarouselSlides();
        const slidesData = data || [];
        setSlides(slidesData);

        // Check for slide ID in URL and set current index
        const params = new URLSearchParams(location.search);
        const slideId = params.get('slide');
        if (slideId && slidesData.length > 0) {
          const index = slidesData.findIndex(s => String(s.id) === String(slideId));
          if (index !== -1) {
            setCurrentIndex(index);
          }
        }
      } catch (err) {
        console.error('Failed to load carousel slides:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSlides();
  }, [location.search]);

  // Auto-rotation every 5 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const goToPrev = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => prev === 0 ? slides.length - 1 : prev - 1);
  };
  
  const goToNext = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => (prev + 1) % slides.length);
  };

  if (loading) return <div className="hero-carousel-loading" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (slides.length === 0) return null;

  return (
    <div className="hero-carousel">
      <div 
        id="mainCarousel" 
        className="carousel slide" 
        data-bs-ride="carousel"
        data-bs-interval="5000"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              data-bs-target="#mainCarousel"
              data-bs-slide-to={idx}
              className={idx === currentIndex ? 'active' : ''}
              aria-current={idx === currentIndex ? 'true' : 'false'}
              aria-label={`Slide ${idx + 1}`}
              onClick={() => goToSlide(idx)}
              style={{ 
                width: '10px', 
                height: '10px', 
                borderRadius: '50%', 
                margin: '0 4px'
              }}
            />
          ))}
        </div>
        
        {/* Carousel Inner */}
        <div className="carousel-inner">
          {slides.map((slide, idx) => (
            <div 
              className={`carousel-item ${idx === currentIndex ? 'active' : ''}`} 
              key={slide.id || idx}
              data-bs-interval="5000"
            >
              <a
                href={slide.cta_link || '#'}
                target="_blank"
                rel="noreferrer"
                className="carousel-slide-link"
                aria-label={`Open: ${slide.title}`}
                onClick={(e) => !slide.cta_link && e.preventDefault()}
              >
                <img 
                  src={resolveFileUrl(slide.image_path)} 
                  className="d-block w-100" 
                  alt={slide.title}
                  style={{ 
                    height: 'clamp(280px, 52vw, 460px)', 
                    objectFit: 'cover'
                  }}
                />
                {/* Overlay Caption */}
                <div className="carousel-caption d-none d-md-block">
                  <div className="container">
                    <div className="row justify-content-center">
                      <div className="col-lg-8">
                        <span 
                          className="badge mb-2" 
                          style={{ 
                            backgroundColor: 'var(--sdo-accent)',
                            fontSize: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                          }}
                        >
                          {slide.category || 'Official Issuance'}
                        </span>
                        <h2 className="display-6 fw-bold mb-2">{slide.title}</h2>
                        <p className="lead mb-3" style={{ fontSize: '1rem', opacity: 0.9 }}>
                          {slide.description}
                        </p>
                        {slide.cta_text && (
                          <div className="btn btn-primary btn-sm px-4 py-2">
                            {slide.cta_text}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Caption */}
                <div className="carousel-caption d-md-none" style={{ padding: '0.85rem', bottom: '2.15rem' }}>
                  <h6 className="mb-1">{slide.title}</h6>
                  <p className="carousel-click-indicator mb-0">Click to view official document</p>
                </div>
              </a>
            </div>
          ))}
        </div>
        
        {/* Carousel Controls */}
        <button 
          className="carousel-control-prev" 
          type="button"
          onClick={goToPrev}
          aria-label="Previous slide"
          style={{ width: '5%' }}
        >
          <span 
            className="carousel-control-prev-icon" 
            aria-hidden="true"
            style={{ 
              backgroundColor: 'rgba(59, 76, 184, 0.8)',
              borderRadius: '50%',
              padding: '1rem'
            }}
          />
        </button>
        <button 
          className="carousel-control-next" 
          type="button"
          onClick={goToNext}
          aria-label="Next slide"
          style={{ width: '5%' }}
        >
          <span 
            className="carousel-control-next-icon" 
            aria-hidden="true"
            style={{ 
              backgroundColor: 'rgba(59, 76, 184, 0.8)',
              borderRadius: '50%',
              padding: '1rem'
            }}
          />
        </button>
      </div>
    </div>
  );
}

export default CarouselSlider;
