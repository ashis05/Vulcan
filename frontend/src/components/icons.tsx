import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

type SparkIconProps = IconProps & {
  filled?: boolean;
};

function baseProps(size: number, color: string) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export function FlameIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Svg>
  );
}

export function SparkIcon({ size = 24, color = 'currentColor', filled = false }: SparkIconProps) {
  if (filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <Path d="M12 2 13.75 10.25 22 12 13.75 13.75 12 22 10.25 13.75 2 12 10.25 10.25Z" />
      </Svg>
    );
  }
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M12 2 13.75 10.25 22 12 13.75 13.75 12 22 10.25 13.75 2 12 10.25 10.25Z" />
    </Svg>
  );
}

export function GoogleIcon({ size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export function AnvilIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M4 9h16l-2.5 7H6.5L4 9Z" />
      <Path d="M4 9c-1.6 0-1.7-2.5-.3-2.5.9 0 1.4-2 1.9-3.5h2.6c-.2 1.8-1 3.4-1.4 6" />
      <Path d="M6.5 16h11l-.6 2.5H7.1L6.5 16Z" />
      <Path d="M9 21.5h6" />
    </Svg>
  );
}

export function DumbbellIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M14.4 14.4 9.6 9.6" />
      <Path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
      <Path d="m21.5 21.5-1.4-1.4" />
      <Path d="M3.9 3.9 2.5 2.5" />
      <Path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
    </Svg>
  );
}

export function AppleIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
      <Path d="M10 2c1 .5 2 2 2 5" />
    </Svg>
  );
}

export function PlateIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M3 9v6M6 8v8M6 12h12M18 8v8M21 9v6" />
    </Svg>
  );
}

export function TrashIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M3 6h18" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Path d="M10 11v6M14 11v6" />
    </Svg>
  );
}

export function CameraIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <Circle cx="12" cy="13" r="4" />
    </Svg>
  );
}

export function PencilIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    </Svg>
  );
}

export function ChartIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <Path d="M7 14l3-3 3 3 5-6" />
    </Svg>
  );
}

export function PersonIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx="12" cy="7" r="4" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M19 12H5" />
      <Path d="M12 19l-7-7 7-7" />
    </Svg>
  );
}

export function ChevronRightIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

export function PlusIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M18 6 6 18M6 6l12 12" />
    </Svg>
  );
}

export function CheckIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)} strokeWidth={2.5}>
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  );
}

export function SearchIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Circle cx="11" cy="11" r="7" />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

export function GripIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)} strokeWidth={2}>
      <Path d="M8 7h.01M8 12h.01M8 17h.01M16 7h.01M16 12h.01M16 17h.01" />
    </Svg>
  );
}

export function ChevronUpIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M18 15l-6-6-6 6" />
    </Svg>
  );
}

export function ChevronDownIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)}>
      <Path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function MoreIcon({ size = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg {...baseProps(size, color)} strokeWidth={2}>
      <Path d="M12 12.5h.01M6 12.5h.01M18 12.5h.01" />
    </Svg>
  );
}