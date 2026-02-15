declare namespace kakao.maps {
  function load(callback: () => void): void;

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    setBounds(bounds: LatLngBounds, paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number): void;
    getCenter(): LatLng;
    getLevel(): number;
    getProjection(): MapProjection;
    relayout(): void;
  }

  interface Point {
    x: number;
    y: number;
  }

  interface MapProjection {
    containerPointFromCoords(latlng: LatLng): Point;
    coordsFromContainerPoint(point: Point): LatLng;
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
    isEmpty(): boolean;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
  }

  class InfoWindow {
    constructor(options: InfoWindowOptions);
    open(map: Map, marker: Marker): void;
    close(): void;
    setContent(content: string): void;
  }

  interface InfoWindowOptions {
    content?: string;
    removable?: boolean;
  }

  class Polyline {
    constructor(options: PolylineOptions);
    setMap(map: Map | null): void;
  }

  interface PolylineOptions {
    path: LatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
    map?: Map;
  }

  class CustomOverlay {
    constructor(options: CustomOverlayOptions);
    setMap(map: Map | null): void;
  }

  interface CustomOverlayOptions {
    position: LatLng;
    content: string;
    map?: Map;
    yAnchor?: number;
    xAnchor?: number;
  }

  namespace event {
    interface MouseEvent {
      latLng: LatLng;
    }
    function addListener(target: object, type: string, callback: (event: MouseEvent) => void): void;
    function removeListener(target: object, type: string, callback: (event: MouseEvent) => void): void;
  }

  namespace services {
    class Places {
      keywordSearch(
        keyword: string,
        callback: (result: PlacesSearchResult[], status: Status) => void,
        options?: PlacesSearchOptions
      ): void;
    }

    class Geocoder {
      coord2Address(
        lng: number,
        lat: number,
        callback: (result: Coord2AddressResult[], status: Status) => void
      ): void;
      addressSearch(
        address: string,
        callback: (result: AddressSearchResult[], status: Status) => void
      ): void;
    }

    interface PlacesSearchResult {
      id: string;
      place_name: string;
      category_name: string;
      address_name: string;
      road_address_name: string;
      phone: string;
      x: string; // longitude
      y: string; // latitude
    }

    interface PlacesSearchOptions {
      size?: number;
      page?: number;
    }

    interface Coord2AddressResult {
      address: {
        address_name: string;
        region_1depth_name: string;
        region_2depth_name: string;
        region_3depth_name: string;
      };
      road_address: {
        address_name: string;
        building_name: string;
      } | null;
    }

    interface AddressSearchResult {
      address_name: string;
      x: string;
      y: string;
      address: {
        address_name: string;
      };
      road_address: {
        address_name: string;
        building_name: string;
      } | null;
    }

    enum Status {
      OK = 'OK',
      ZERO_RESULT = 'ZERO_RESULT',
      ERROR = 'ERROR',
    }
  }
}
