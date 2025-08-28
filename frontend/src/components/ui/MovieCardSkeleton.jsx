import React from 'react';
import Skeleton from './Skeleton';

const MovieCardSkeleton = ({ variant = 'default', className = '' }) => {
  const variants = {
    default: {
      image: "aspect-[2/3]",
      title: "h-4",
      meta: "h-3",
      content: "p-3"
    },
    compact: {
      image: "aspect-[2/3]",
      title: "h-3",
      meta: "h-2",
      content: "p-2"
    },
    featured: {
      image: "aspect-video",
      title: "h-6",
      meta: "h-4",
      content: "p-4"
    }
  };

  const currentVariant = variants[variant];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Image Skeleton */}
      <Skeleton className={`w-full ${currentVariant.image}`} />
      
      {/* Content Skeleton */}
      <div className={currentVariant.content}>
        {/* Title Skeleton */}
        <Skeleton className={`w-3/4 ${currentVariant.title} mb-2`} />
        
        {/* Meta Information Skeleton */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className={`w-16 ${currentVariant.meta}`} />
            <Skeleton className={`w-20 ${currentVariant.meta}`} />
          </div>
          <Skeleton className={`w-24 ${currentVariant.meta}`} />
        </div>
        
        {/* Description Skeleton (Featured variant only) */}
        {variant === 'featured' && (
          <div className="space-y-2 mt-3">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-5/6 h-3" />
            <Skeleton className="w-4/6 h-3" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieCardSkeleton;
