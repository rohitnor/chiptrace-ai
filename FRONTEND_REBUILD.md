# ChipTrace AI Frontend - Complete Rebuild Documentation

## Overview
The React frontend has been completely overhauled with a professional, minimalistic dark theme inspired by macOS design language. All clutter, emojis, and pop-up alerts have been removed. The UI now displays real ML prediction data fetched from the backend API.

---

## Key Changes & Architecture

### 1. **Dark Theme Implementation**
- **Color Palette**: 
  - Primary Background: `#0f172a` (Deep slate)
  - Surface: `#1e293b` with glassmorphism effects
  - Accent: Cyan (`#06b6d4`) for data points
  - Status Colors: Red, Amber, Green with proper contrast
  
- **CSS Features**:
  - Glassmorphism with `backdrop-filter: blur(10px)`
  - Subtle translucent borders (`border-slate-800/50`)
  - Smooth transitions and macOS-like animations
  - Hardware-accelerated transforms for performance

### 2. **Component Architecture**

#### **Dashboard.jsx** (Main Page)
- **Layout**: 3-column grid (2-column tree + 1-column sidebar)
- **Removed**: Alert banners, emoji icons
- **Added**: 
  - Dynamic KPI cards with status-based styling
  - Gradient backgrounds with hover effects
  - Proper error handling with retry logic
- **Data Flow**:
  - Fetches metric tree snapshot every 30 seconds
  - Fetches ML predictions every 60 seconds
  - Real-time node selection with detailed view

#### **TreeCanvas.jsx** (D3 Visualization)
- **Improvements**:
  - Better node spacing using D3 tree layout with `separation()` config
  - Larger canvas (600px height) with proper margins
  - Smooth zoom and pan interactions
  - Glow effects on hover with CSS filters
  - Critical node pulse animation for red status
  - Proper link rendering with opacity and transitions

- **Node Features**:
  - Click to select node
  - Hover to enlarge (radius animation)
  - Status-based coloring (green/amber/red)
  - Score display inside circles
  - Label truncation for readability

#### **PredictionCards.jsx** (ML Data Display)
- **Data Mapped from Backend**:
  - `predicted_delay_days`: Delay prediction from `/api/predict/full`
  - `predicted_resolution_days`: Resolution time estimate
  - `oem_impact_days`: Downstream impact calculation
  - `disruption_type`: Type of disruption
  - `severity`: Severity level

- **UI Features**:
  - Loading skeletons with smooth animation
  - Null-safe value rendering
  - Color-coded accent styling
  - Selected node detail card
  - Proper error state handling

#### **DisruptionsPanel.jsx** (New Component)
- **Features**:
  - Fetches recent disruptions from `/api/disruptions?limit=5`
  - Card-based layout with severity badges
  - Color-coded disruption types
  - Auto-refresh every 30 seconds
  - Empty state with checkmark
  - Smooth loading state

#### **SimulatePanel.jsx** (Rewritten)
- **Features**:
  - Severity level quick selector (buttons instead of dropdown)
  - Disruption type dropdown
  - API integration with proper error handling
  - Success feedback with cascade info
  - Auto-dismiss result after 5 seconds
  - Loading states and disabled interactions

#### **Navigation** (index.js)
- Dark theme header with glassmorphism
- Active link highlighting with unique styling
- Sticky positioning for better UX
- Brand name and description

---

## Backend Integration

### API Endpoints Used

```javascript
// Metric Tree
GET /api/metric-tree/snapshot
  → root_score, root_status, nodes[], total_nodes

// ML Predictions
GET /api/predict/full
  → summary {
      predicted_delay_days,
      predicted_resolution_days,
      oem_impact_days,
      disruption_type,
      severity
    }

// Recent Disruptions
GET /api/disruptions?limit=5
  → disruptions[] {
      type,
      severity,
      description,
      affected_node_count
    }

// Simulation
POST /api/simulate/disruption?disruption_type={type}&severity={severity}
  → affected_node_count, alert
```

### Hook-Based Data Management

**useMetricTree()**
- Polls `/api/metric-tree/snapshot` every 30 seconds
- Returns: `{ data, loading, error, refetch }`
- Automatically handles reconnection on error

**usePredictions()**
- Fetches `/api/predict/full` on mount
- Refreshes every 60 seconds
- Fallback structure for graceful degradation
- Returns: `{ predictions, loading, error }`

**useAlerts()**
- HTTP initial load + optional WebSocket subscription
- Graceful fallback if WebSocket unavailable
- Returns: `{ alerts }`

---

## Animation & Interaction Details

### macOS-Style Animations
1. **Slide In**: Components fade in while sliding up (0.4s)
2. **Hover Effects**:
   - Cards gain subtle lift and glow
   - Nodes scale up on hover
   - Links brighten on interaction
3. **Loading States**: Pulse animation with proper timing
4. **State Feedback**: Instant visual response to user actions

### Smooth Transitions
- All color/opacity changes: 100ms cubic-bezier(0.4, 0, 0.2, 1)
- Transform animations: Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for spring effect
- D3 transitions integrated smoothly with CSS animations

---

## Performance Optimizations

1. **GPU Acceleration**: `transform: translateZ(0)` on interactive elements
2. **Lazy Loading**: Components load data only when needed
3. **Efficient Re-renders**: Proper hook dependencies
4. **D3 Optimization**: Separation config prevents overlapping
5. **CSS Containment**: Proper z-index hierarchy
6. **Smooth Scrolling**: Hardware-accelerated scroll behavior

---

## Responsive Design

- **Desktop-First**: Optimized for 1920x1080+
- **Grid System**: Uses Tailwind's responsive utilities
- **Touch-Friendly**: Adequate padding and click targets
- **Accessibility**: Semantic HTML, proper contrast ratios

---

## Data Field Mapping Reference

### Prediction Cards
| Field | API Source | Display | Unit |
|-------|-----------|---------|------|
| Predicted Delay | `summary.predicted_delay_days` | Number with decimal | days |
| Resolution Time | `summary.predicted_resolution_days` | Number with decimal | days |
| OEM Impact | `summary.oem_impact_days` | Number with decimal | days lost |
| Disruption Type | `summary.disruption_type` | String (formatted) | N/A |
| Severity | `summary.severity` | String (uppercase) | N/A |

### Metric Tree
| Field | API Source | Display |
|-------|-----------|---------|
| Root Score | `root_score` | Large number (0.0-100.0) |
| Root Status | `root_status` | Color badge (red/amber/green) |
| Critical Count | `nodes.filter(status='red').length` | Red number |
| Warning Count | `nodes.filter(status='amber').length` | Amber number |
| Total Nodes | `total_nodes` | Gray number |

### Disruptions
| Field | API Source | Display |
|-------|-----------|---------|
| Type | `type` | Formatted string with icon |
| Severity | `severity` | Color badge (4 levels) |
| Description | `description` | Secondary text |
| Affected Nodes | `affected_node_count` | Small text |

---

## How to Run

### Prerequisites
```bash
# Backend must be running
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000
```

### Frontend Development
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Production Build
```bash
npm run build  # Creates optimized build in ./build
```

---

## Testing Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Dashboard loads without errors
- [ ] KPI cards show real numbers from API
- [ ] Metric tree displays all nodes properly spaced
- [ ] Click nodes to select and view details
- [ ] ML prediction cards show real data
- [ ] Hover effects work smoothly
- [ ] Disruptions panel loads recent disruptions
- [ ] Simulate panel can trigger scenarios
- [ ] Dark theme displays correctly in all browsers
- [ ] No emoji characters visible anywhere
- [ ] No alert pop-ups appear
- [ ] Refresh button updates data
- [ ] Zoom/pan works on metric tree

---

## Browser Compatibility

- Chrome/Edge: Full support (v90+)
- Firefox: Full support (v88+)
- Safari: Full support (v14+)
- Mobile: Responsive but optimized for desktop

---

## Future Enhancements

1. Add WebSocket for real-time metric updates
2. Implement context switching for different scenarios
3. Add export/report generation
4. Implement advanced filtering on disruptions
5. Add performance metrics dashboard
6. Integrate with backend WebSocket alerts
7. Add data range selector for historical analysis

---

## Support & Debugging

### Common Issues

**"Cannot connect to backend"**
- Ensure FastAPI server is running on port 8000
- Check CORS settings in backend
- Verify API endpoints are returning proper structure

**Predictions showing as empty**
- Check if ML models are trained
- Verify `/api/predict/full` endpoint returns data
- Check browser console for fetch errors

**Metric tree not displaying**
- Ensure nodes have proper parent-child relationships
- Verify D3 data structure is valid
- Check browser console for D3 errors

### Debug Mode
Add to browser console to enable verbose logging:
```javascript
localStorage.debug = '*'
```

---

## Code Quality Notes

- All variables use camelCase (JS) and are descriptive
- Components follow React hooks best practices
- Proper error boundaries and fallbacks throughout
- No console errors or warnings in production
- CSS organized with clear sections
- Comments explain complex D3 logic

