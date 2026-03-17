'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

// Declare naver global object to avoid TS errors
declare global {
  interface Window {
    naver: any;
  }
}

interface Location {
  id: string;
  gu: string;
  address: string;
  area: string;
  rooms: string;
  lat: string;
  lng: string;
}

interface NaverMapProps {
  locations: Location[];
}

export default function NaverMap({ locations }: NaverMapProps) {
  const mapElement = useRef<HTMLDivElement>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);


  // Initialize Map
  useEffect(() => {
    if (!isScriptLoaded || !mapElement.current || !window.naver) return;

    // Default center (Seoul City Hall)
    let centerLat = 37.5666805;
    let centerLng = 126.9784147;

    // Or center to the first available location
    if (locations.length > 0) {
      centerLat = parseFloat(locations[0].lat);
      centerLng = parseFloat(locations[0].lng);
    }

    const mapOptions = {
      center: new window.naver.maps.LatLng(centerLat, centerLng),
      zoom: 13,
      minZoom: 7,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    };

    const map = new window.naver.maps.Map(mapElement.current, mapOptions);
    const infoWindows: any[] = [];

    // Add Markers
    locations.forEach((loc, index) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(parseFloat(loc.lat), parseFloat(loc.lng)),
        map: map,
        title: loc.address,
        animation: window.naver.maps.Animation.DROP
      });

      // HTML content for InfoWindow
      const contentString = `
        <div class="p-4 bg-white rounded-lg shadow-sm border border-gray-100 max-w-xs">
            <h3 class="font-bold text-gray-900 text-sm mb-1">
               <span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mr-1">${loc.gu}</span>
               ${loc.address.split('(')[0]}
            </h3>
            <div class="text-xs text-gray-600 mt-2 space-y-1">
               <p><span class="font-medium text-gray-500">원주소:</span> ${loc.address}</p>
               <div class="flex space-x-3 mt-1 pt-1 border-t border-gray-50">
                   <p><span class="font-medium text-gray-500">면적:</span> ${loc.area}㎡</p>
                   <p><span class="font-medium text-gray-500">방 수:</span> ${loc.rooms}개</p>
               </div>
            </div>
        </div>
      `;

      const infoWindow = new window.naver.maps.InfoWindow({
        content: contentString,
        backgroundColor: "transparent",
        borderColor: "transparent",
        anchorSkew: true,
        anchorSize: new window.naver.maps.Size(12, 12),
        pixelOffset: new window.naver.maps.Point(0, -10)
      });

      infoWindows.push(infoWindow);

      // On marker click
      window.naver.maps.Event.addListener(marker, "click", (e: any) => {
        // Close all other info windows first
        infoWindows.forEach(iw => iw.close());
        
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(map, marker);
        }
      });
    });

  }, [isScriptLoaded, locations]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`}
        onReady={() => setIsScriptLoaded(true)}
        onError={() => console.error('Failed to load Naver Maps SDK')}
      />
      <div className="w-full h-full relative">
        <div ref={mapElement} className="w-full h-full" id="map" />
        {!isScriptLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </>
  );
}
