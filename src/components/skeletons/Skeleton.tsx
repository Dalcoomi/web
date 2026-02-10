import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, style, ...props }: SkeletonProps) => {
  return (
    <div
      className={`skeleton-shimmer rounded-md ${className}`}
      style={{
        background:
          "linear-gradient(90deg, rgba(18,19,21,0.02) 0%, rgba(18,19,21,0.10) 100%)",
        ...style,
      }}
      {...props}
    />
  );
};

export default Skeleton;
