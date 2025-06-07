# E2E Testing Requirements for WalkerNest UX Flows

## Overview
This document outlines comprehensive End-to-End (E2E) testing requirements for WalkerNest application components using MCP Playwright server. The testing framework should validate core user journeys, cross-component integration, and mobile touch interactions.

## Component Coverage

### Core Components (6 Total)
1. **AnalyzeApartment** - Walking distance analysis form
2. **FavoritesList** - Saved apartment management  
3. **CheckRoute** - Route planning between points
4. **ManageLayer** - Map layer visibility controls
5. **FeaturePopup** - Apartment feature details popup
6. **NameFavoritePopup** - Favorite naming dialog

## Functional Requirements

### 1. AnalyzeApartment Component

**Form Validation:**
- ✅ All three walking distance fields are required (park, supermarket, cafe)
- ✅ Dropdown values: 1-15 minutes in 1-minute increments
- ✅ Submit disabled until all fields completed
- ✅ Close button returns to map without saving

**Analysis Flow:**
- ✅ Form submission triggers AnalysisProgressDialog (modal with progress bar)
- ✅ Analysis API call takes 3-8 seconds typically
- ✅ Success shows apartment features on map (clickable when analysis complete)
- ✅ Error handling with retry mechanism (1 automatic retry)

**Touch Events:**
- ✅ Close and Analyze buttons support both onClick and onTouchEnd
- ✅ Touch events prevent default behavior to avoid double-firing

### 2. FavoritesList Component

**Display Logic:**
- ✅ Empty state: "No favorites are added yet."
- ✅ List shows: apartment name, city, delete icon
- ✅ Visual feedback for selected item (highlighted background)

**Interaction:**
- ✅ Click apartment name: flyTo location + city switch if different
- ✅ Click trash icon: immediate deletion (no confirmation dialog)
- ✅ Cross-city favorites: all favorites displayed together, auto-switch city when selected
- ✅ Data persistence: localStorage synchronization

**Touch Events:**
- ✅ Apartment selection and trash icon support touch interactions
- ✅ Proper event propagation handling for nested interactions

### 3. CheckRoute Component

**Point Selection:**
- ✅ Two input fields: starting and ending addresses
- ✅ MapPin button: enables map clicking for point selection
- ✅ CircleX button: clears selected point
- ✅ Address input: geocoding with Enter key submission
- ✅ Map interaction: cursor changes during selection mode

**Route Calculation:**
- ✅ Auto-trigger when both points selected
- ✅ First point gets flyTo, second point skips flyTo, route completion uses fitBounds
- ✅ Route API call takes 1-3 seconds typically
- ✅ ArrowDownUp button: swaps starting/ending points

**Touch Events:**
- ✅ All buttons (MapPin, CircleX, ArrowDownUp) support touch interactions
- ✅ Enhanced mobile usability for point selection workflow

### 4. ManageLayer Component

**Layer Controls:**
- ✅ 6 toggle switches: result, cluster, park, supermarket, cafe, boundary
- ✅ Real-time map layer visibility updates
- ✅ State persistence during session
- ✅ Maximum 6 concurrent visible layers for optimal map performance

**Layer Types:**
- **result**: Matched apartments (post-analysis)
- **cluster**: Apartment clusters
- **park**: Parks and dog parks
- **supermarket**: Grocery stores
- **cafe**: Coffee shops and cafes
- **boundary**: City administrative boundaries

### 5. FeaturePopup Component

**Content Display:**
- ✅ Apartment details from clicked map feature
- ✅ Heart icon for favoriting
- ✅ Close button (X icon)
- ✅ Popup positioning: anchored to feature location

**Interaction:**
- ✅ Heart icon click: opens NameFavoritePopup
- ✅ Close button: dismisses popup
- ✅ Outside click: closes popup
- ✅ Only available after analysis completion

**Touch Events:**
- ✅ Heart icon supports touch interactions with visual feedback
- ✅ Close button enhanced for mobile usability

### 6. NameFavoritePopup Component

**Form Behavior:**
- ✅ Pre-filled with apartment name (if available, not "N/A")
- ✅ Minimum 2 characters required
- ✅ Real-time validation feedback
- ✅ Save button disabled until valid

**Actions:**
- ✅ Save: adds to favorites + localStorage + success toast
- ✅ Cancel: closes without saving
- ✅ Close (X): same as cancel
- ✅ API integration: fetches full feature data for storage

**Touch Events:**
- ✅ Cancel button supports touch interactions
- ✅ Save button maintains form submission behavior

## Integration Flow Requirements

### 1. Primary Data Loading Flow
**Sequence:** City Selection → Amenities Load → Analysis Trigger → Results Display
- ✅ City change loads amenities immediately (default data via AmenitiesLayers API)
- ✅ Analysis creates apartment features (clickable post-analysis)

### 2. Feature Interaction & Favorites Flow  
**Sequence:** Feature Click → Popup → Favorite → Name → Save
- ✅ Feature click opens FeaturePopup (only after analysis)
- ✅ Heart icon triggers NameFavoritePopup
- ✅ Save process includes API call + localStorage + toast notification
- ✅ Error handling for save failures with retry option

### 3. Favorites to Route Planning Flow
**Sequence:** Select Favorite → Map FlyTo → Route Planning
- ✅ Favorite selection: flyTo + city switch if needed
- ✅ Route planning can use favorite location as start/end point
- ✅ Cross-city routing supported with automatic city context switching

### 4. Layer Visibility Control Flow
**Sequence:** Toggle Layers → Real-time Updates → Visual Feedback
- ✅ Immediate visual feedback on toggle
- ✅ Maximum 4 concurrent layers enforced

### 5. Cross-Component State Synchronization
**Sequence:** State Changes → Component Updates → Data Persistence
- ✅ City changes propagate to all relevant components
- ✅ Favorites synchronize between localStorage and component state
- ✅ Route state clears appropriately on context changes

## Technical Requirements

### State Management
- **Form Persistence:** No - forms reset across browser sessions
- **Favorites Persistence:** Yes - localStorage with cross-city display
- **Route Caching:** Recommended - memory-only cache with LRU eviction (15 routes max)
- **Layer Management:** Maximum 6 concurrent visible layers

### Error Handling
- **Retry Logic:** 1 automatic retry before showing error message
- **Offline Behavior:** Show appropriate error messages for network failures
- **Data Validation:** Client-side validation with server-side confirmation
- **Confirmation Dialogs:** Immediate deletion without confirmation prompts

### Cross-City Data Behavior
- **Favorites Display:** All cities shown together in unified list
- **City Switching:** Automatic when selecting favorite from different city  
- **Data Loading:** Each city maintains independent amenity data
- **Route Planning:** Supports cross-city routing with context switching

### Mobile Touch Enhancements
- **Touch Events:** All interactive elements support onTouchEnd
- **Event Prevention:** Touch handlers prevent default to avoid double-firing
- **Touch Targets:** Buttons optimized for finger interaction
- **Gesture Support:** Standard touch gestures work across all components

## Test Environment Setup

### Available Test Data
**Cities:** All cities from combobox
- denver north  
- denver south
- aurora

**Data Sources:**
- Real APIs via Docker (`npm run dev` command)
- Full backend integration testing
- Consistent test environment via containerization

### Browser Support Matrix
**Required Testing:**
- **Chrome** (latest) - Primary development browser
- **Safari** (latest) - WebKit engine, Mac/iOS compatibility
- **Edge** (latest) - Chromium-based, Windows compatibility

### Device Testing Requirements
**Mobile Devices:**
- **iPhone 13/14** (375×812, 390×844) - iOS Safari
- **iPhone SE** (375×667) - Small screen edge cases
- **Samsung Galaxy S21/S22** (360×800, 384×854) - Android Chrome
- **iPad** (768×1024, 820×1180) - Tablet interaction patterns

**Screen Size Coverage:**
- **Mobile:** 360px - 414px wide
- **Tablet:** 768px - 1024px wide  
- **Desktop:** 1280px+ wide

### Touch Interaction Testing
**Verified Elements:**
- Heart icon favoriting
- Favorites list selection and deletion
- Route planning button interactions  
- Popup close buttons
- Form submission buttons
- Map layer toggle switches

## Test Scenarios

### Critical Path Testing
1. **New User Journey:** City selection → Analysis → Feature interaction → Favoriting
2. **Return User Journey:** Favorites access → Cross-city navigation → Route planning
3. **Power User Journey:** Multiple analyses → Layer management → Complex routing

### Edge Case Testing  
1. **Network Failures:** API timeouts, retry mechanisms, offline behavior
2. **Data Limits:** Maximum favorites, layer visibility thresholds
3. **Cross-Browser:** Ensure consistent behavior across all supported browsers
4. **Mobile-Specific:** Touch interactions, screen size adaptations, orientation changes

## Success Criteria

### Functional Success
- ✅ All component interactions work reliably
- ✅ Cross-component integration flows complete successfully
- ✅ Data persistence works correctly across sessions
- ✅ Error handling provides appropriate user feedback

### Cross-Platform Success
- ✅ Identical functionality across all supported browsers
- ✅ Touch interactions work properly on all mobile devices
- ✅ Responsive design adapts appropriately to all screen sizes

This comprehensive testing framework ensures robust validation of WalkerNest's core user experience across all supported platforms and interaction methods. 