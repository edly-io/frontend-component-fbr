import { useMediaQuery } from '@openedx/paragon';

const LG_BREAKPOINT_PX = 992;

export default function useIsBelowLg(): boolean {
  return !useMediaQuery({ minWidth: LG_BREAKPOINT_PX });
}
