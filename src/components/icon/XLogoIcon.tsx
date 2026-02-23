type XLogoIconProps = {
  color?: string;
  background?: string;
  className?: string;
};

const XLogoIcon = ({
  color = '#FFFFFF',
  background = 'transparent',
  className,
}: XLogoIconProps) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="24" height="24" fill={color} style={{opacity: 1}} className={className}>
      <rect x="0" y="0" width="512" height="512" fill={background} />
      <path  d="M296.591 223.331L455.427 42.667h-37.639L279.871 199.535L169.716 42.667H42.666l166.575 237.212L42.666 469.333h37.642l145.644-165.658l116.331 165.658h127.05L296.582 223.331zm-51.555 58.638l-16.877-23.621L93.87 70.393h57.815L260.057 222.08l16.878 23.621l140.871 197.168h-57.815l-114.955-160.89z"/>
    </svg>
  );
};

export default XLogoIcon;