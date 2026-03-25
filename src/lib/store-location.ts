/**
 * Cấu hình vị trí quán để kiểm tra geolocation khi đặt hàng.
 * Chỉ cho phép gửi đơn khi khách ở trong bán kính (tránh dùng QR đã chụp từ xa).
 *
 * Thêm vào .env.local:
 *   NEXT_PUBLIC_STORE_LAT=10.xxxxxx
 *   NEXT_PUBLIC_STORE_LNG=106.xxxxxx
 *   NEXT_PUBLIC_STORE_RADIUS_M=80
 * Nếu không cấu hình thì không bật kiểm tra vị trí (chỉ cần có table từ QR).
 */

const lat = typeof process.env.NEXT_PUBLIC_STORE_LAT !== "undefined"
  ? parseFloat(process.env.NEXT_PUBLIC_STORE_LAT)
  : NaN;
const lng = typeof process.env.NEXT_PUBLIC_STORE_LNG !== "undefined"
  ? parseFloat(process.env.NEXT_PUBLIC_STORE_LNG)
  : NaN;
const radiusM = typeof process.env.NEXT_PUBLIC_STORE_RADIUS_M !== "undefined"
  ? parseInt(process.env.NEXT_PUBLIC_STORE_RADIUS_M, 10)
  : 100;

export const storeLocation =
  !Number.isNaN(lat) && !Number.isNaN(lng) && radiusM > 0
    ? { lat, lng, radiusM }
    : null;

/** Khoảng cách giữa hai điểm (Haversine), đơn vị mét */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
