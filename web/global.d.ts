// Add declaration overrides for modules without type definitions
declare module "next/server" {
  export type NextRequest = import("next").NextRequest;
  export type NextResponse = import("next").NextResponse;
  export const NextResponse: any;
}
