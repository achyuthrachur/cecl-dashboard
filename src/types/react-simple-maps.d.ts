// Type declarations for react-simple-maps
// https://github.com/zcreativelabs/react-simple-maps

declare module 'react-simple-maps' {
  import * as React from 'react'
  import { GeoProjection } from 'd3-geo'

  // Projection types
  export type ProjectionName =
    | 'geoAlbersUsa'
    | 'geoAzimuthalEqualArea'
    | 'geoAzimuthalEquidistant'
    | 'geoConicConformal'
    | 'geoConicEqualArea'
    | 'geoConicEquidistant'
    | 'geoEqualEarth'
    | 'geoEquirectangular'
    | 'geoGnomonic'
    | 'geoMercator'
    | 'geoNaturalEarth1'
    | 'geoOrthographic'
    | 'geoStereographic'
    | 'geoTransverseMercator'

  export interface ProjectionConfig {
    scale?: number
    center?: [number, number]
    rotate?: [number, number, number]
    parallels?: [number, number]
  }

  // ComposableMap
  export interface ComposableMapProps {
    width?: number
    height?: number
    projection?: ProjectionName | GeoProjection
    projectionConfig?: ProjectionConfig
    className?: string
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  export const ComposableMap: React.FC<ComposableMapProps>

  // ZoomableGroup
  export interface Position {
    coordinates: [number, number]
    zoom: number
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    filterZoomEvent?: (event: React.WheelEvent | React.TouchEvent) => boolean
    onMoveStart?: (position: Position, event: React.MouseEvent | React.TouchEvent) => void
    onMove?: (position: Position, event: React.MouseEvent | React.TouchEvent) => void
    onMoveEnd?: (position: Position, event: React.MouseEvent | React.TouchEvent) => void
    className?: string
    style?: React.CSSProperties
    children?: React.ReactNode
  }

  export const ZoomableGroup: React.FC<ZoomableGroupProps>

  // Geographies
  export interface GeographyObject {
    type: string
    id: string
    properties: Record<string, unknown>
    geometry: {
      type: string
      coordinates: number[] | number[][] | number[][][]
    }
    rsmKey: string
  }

  export interface GeographiesChildrenArguments {
    geographies: GeographyObject[]
    outline: GeographyObject
    borders: GeographyObject
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>
    children: (args: GeographiesChildrenArguments) => React.ReactNode
    parseGeographies?: (geographies: GeographyObject[]) => GeographyObject[]
  }

  export const Geographies: React.FC<GeographiesProps>

  // Geography
  export interface GeographyStyleObject {
    default?: React.CSSProperties
    hover?: React.CSSProperties
    pressed?: React.CSSProperties
  }

  export interface GeographyProps {
    geography: GeographyObject
    style?: GeographyStyleObject
    className?: string
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseDown?: (event: React.MouseEvent<SVGPathElement>) => void
    onMouseUp?: (event: React.MouseEvent<SVGPathElement>) => void
    onFocus?: (event: React.FocusEvent<SVGPathElement>) => void
    onBlur?: (event: React.FocusEvent<SVGPathElement>) => void
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void
    tabIndex?: number
  }

  export const Geography: React.FC<GeographyProps>

  // Marker
  export interface MarkerProps {
    coordinates: [number, number]
    style?: GeographyStyleObject
    className?: string
    onMouseEnter?: (event: React.MouseEvent<SVGGElement>) => void
    onMouseLeave?: (event: React.MouseEvent<SVGGElement>) => void
    onMouseDown?: (event: React.MouseEvent<SVGGElement>) => void
    onMouseUp?: (event: React.MouseEvent<SVGGElement>) => void
    onFocus?: (event: React.FocusEvent<SVGGElement>) => void
    onBlur?: (event: React.FocusEvent<SVGGElement>) => void
    onClick?: (event: React.MouseEvent<SVGGElement>) => void
    tabIndex?: number
    children?: React.ReactNode
  }

  export const Marker: React.FC<MarkerProps>

  // Annotation
  export interface AnnotationProps {
    subject: [number, number]
    dx?: number
    dy?: number
    curve?: number
    connectorProps?: React.SVGProps<SVGPathElement>
    children?: React.ReactNode
  }

  export const Annotation: React.FC<AnnotationProps>

  // Line
  export interface LineProps {
    from: [number, number]
    to: [number, number]
    coordinates?: [number, number][]
    stroke?: string
    strokeWidth?: number
    fill?: string
    className?: string
    style?: React.CSSProperties
  }

  export const Line: React.FC<LineProps>

  // Graticule
  export interface GraticuleProps {
    step?: [number, number]
    stroke?: string
    strokeWidth?: number
    fill?: string
    className?: string
    style?: React.CSSProperties
  }

  export const Graticule: React.FC<GraticuleProps>

  // Sphere
  export interface SphereProps {
    id?: string
    stroke?: string
    strokeWidth?: number
    fill?: string
    className?: string
    style?: React.CSSProperties
  }

  export const Sphere: React.FC<SphereProps>

  // useGeographies hook
  export interface UseGeographiesResult {
    geographies: GeographyObject[]
    outline: GeographyObject
    borders: GeographyObject
  }

  export function useGeographies(props: {
    geography: string | Record<string, unknown>
    parseGeographies?: (geographies: GeographyObject[]) => GeographyObject[]
  }): UseGeographiesResult

  // useZoomPan hook
  export interface UseZoomPanResult {
    mapRef: React.RefObject<SVGGElement>
    transformString: string
    position: Position
    setPosition: React.Dispatch<React.SetStateAction<Position>>
  }

  export function useZoomPan(props: Omit<ZoomableGroupProps, 'children'>): UseZoomPanResult
}
