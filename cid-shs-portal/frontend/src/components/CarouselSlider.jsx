import React, { useState, useEffect } from 'react';
import { sliderImages } from '../services/mockData';

/**
 * CarouselSlider - Hero carousel with automatic rotation
 * Displays latest news, achievements, and announcements
 */
export function CarouselSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-rotation every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % sliderImages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };
  
  const goToPrev = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => prev === 0 ? sliderImages.length - 1 : prev - 1);
  };
  
  const goToNext = (e) => {
    e.preventDefault();
    setCurrentIndex(prev => (prev + 1) % sliderImages.length);
  };

  return (
    <div className="hero-carousel">
      <div 
        id="mainCarousel" 
        className="carousel slide" 
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {sliderImages.map((img, idx) => (
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
          {sliderImages.map((img, idx) => (
            <div 
              className={`carousel-item ${idx === currentIndex ? 'active' : ''}`} 
              key={idx}
              data-bs-interval="5000"
            >
              <img 
                src={img.src} 
                className="d-block w-100" 
                alt={img.title}
                style={{ 
                  height: '400px', 
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
                        {img.category}
                      </span>
                      <h3 className="mb-2">{img.title}</h3>
                      <p className="mb-0">{img.caption}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mobile Caption */}
              <div className="carousel-caption d-md-none" style={{ padding: '1rem', bottom: '0.5rem' }}>
                <h6 className="mb-0">{img.title}</h6>
              </div>
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
