# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Drupal 7 module called "Environmental Map" (envmap) that provides an interactive map interface for displaying environmental pollution data in Taiwan. The module integrates with external APIs to show factory locations, air quality monitoring stations, and related environmental enforcement data.

## Architecture

### Core Components

**Drupal Module Structure:**
- `envmap.module` - Main Drupal module file with hooks, menu callbacks, and form definitions
- `envmap.info` - Module metadata (Drupal 7.x-1.0-beta)
- `envmap.data.inc` - Data processing functions for filtering and caching factory/environmental data

**Frontend Map Application:**
- `envmap/` - Standalone map application directory
- `envmap/map.js` - Core map functionality using Leaflet.js with jQuery bindings
- `envmap.js` - Drupal integration layer for the map
- `envmap/index.html` - Standalone demo/testing interface

### Key Dependencies

**JavaScript Libraries (in envmap/vendor/):**
- Leaflet.js - Main mapping library
- jQuery with custom bindings plugin
- Leaflet plugins: MarkerCluster, AwesomeMarkers, WMTS tile layers, SvgShapeMarkers
- IntroJS for user onboarding
- Nice-select for styled form controls

**External APIs:**
- Taiwan environmental monitoring data (thaubing.gcaa.org.tw)
- Font Awesome for icons

### Data Flow

1. **Data Caching:** Factory and environmental data is cached in `public://factory/` with 5-minute expiration
2. **Dynamic Filtering:** Map data is filtered based on location, factory type, pollution type, violation records
3. **Real-time Monitoring:** Integrates real-time pollution monitoring data with threshold alerts
4. **Search Interface:** Provides county-based location filtering and text search for facility names

### Map Features

- **Factory Pollution Sources:** Shows registered facilities with violation records and penalty amounts
- **Air Quality Stations:** Government monitoring stations with current readings
- **Micro Air Sensors:** Community-deployed air quality monitors
- **Illegal Factories:** Highlights unregistered facilities on agricultural land
- **Real-time Alerts:** Displays facilities exceeding pollution thresholds

## Development

### File Structure
- Root level: Drupal module files
- `envmap/` - Standalone map application
- `css/` and `js/` - Drupal-specific assets
- `envmap/data/` - Static data files (county boundaries, sample data)
- `envmap/vendor/` - Third-party JavaScript libraries

### No Build Process
This is a traditional Drupal module with no build tools, package managers, or automated testing. Files are edited directly and deployed to Drupal installations.

### Data Processing
- Database queries are built dynamically based on filter parameters in `envmap.data.inc`
- Results are cached as JavaScript files with factory coordinates and metadata
- Cron job (`envmap_cron`) handles data purging and real-time data updates

### Drupal Integration
- Provides menu callbacks for `/envmap` and `/envmap/data/*` endpoints
- Creates a "地圖搜尋" (Map Search) block for the search interface
- Uses Drupal's Views system for data queries with custom query alterations