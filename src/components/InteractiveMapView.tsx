import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  List,
  Layers,
  Search,
  Filter,
  X,
  RotateCcw,
  Maximize2,
  ChevronRight,
  School,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Compass,
  SlidersHorizontal,
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { WaterReport, PriorityBand, IssueCategory, ReportStatus } from '../types';
import { getPriorityBandColor } from '../utils/scoring';
import { NavTab } from './Sidebar';

interface InteractiveMapViewProps {
  onSelectReportForReview?: (reportId: string) => void;
  setActiveTab: (tab: NavTab) => void;
}

// Uganda center coordinates and default zoom
const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  onSelectReportForReview,
  setActiveTab,
}) => {
  const { reports } = useReports();

  // View & selection states
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Map state & references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Available districts from current reports
  const availableDistricts = useMemo(() => {
    return Array.from(new Set(reports.map((r) => r.district))).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          report.reportId.toLowerCase().includes(q) ||
          report.waterPointName.toLowerCase().includes(q) ||
          report.locationName.toLowerCase().includes(q) ||
          report.district.toLowerCase().includes(q) ||
          report.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      // District
      if (districtFilter !== 'all' && report.district !== districtFilter) return false;

      // Issue Type
      if (issueFilter !== 'all' && report.issueType !== issueFilter) return false;

      // Priority
      if (priorityFilter !== 'all' && report.priorityBand !== priorityFilter) return false;

      // Status
      if (statusFilter !== 'all' && report.status !== statusFilter) return false;

      return true;
    });
  }, [reports, searchQuery, districtFilter, issueFilter, priorityFilter, statusFilter]);

  // Separate reports with valid coordinates vs without
  const reportsWithCoords = useMemo(() => {
    return filteredReports.filter(
      (r) =>
        r.coordinates &&
        typeof r.coordinates.lat === 'number' &&
        typeof r.coordinates.lng === 'number' &&
        !isNaN(r.coordinates.lat) &&
        !isNaN(r.coordinates.lng)
    );
  }, [filteredReports]);

  const reportsWithoutCoords = useMemo(() => {
    return filteredReports.filter(
      (r) =>
        !r.coordinates ||
        typeof r.coordinates.lat !== 'number' ||
        typeof r.coordinates.lng !== 'number' ||
        isNaN(r.coordinates.lat) ||
        isNaN(r.coordinates.lng)
    );
  }, [filteredReports]);

  // Selected report object
  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.reportId === selectedReportId) || null;
  }, [reports, selectedReportId]);

  // Helper to clear all filters
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    districtFilter !== 'all' ||
    issueFilter !== 'all' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDistrictFilter('all');
    setIssueFilter('all');
    setPriorityFilter('all');
    setStatusFilter('all');
  };

  // Helper to create custom SVG pins with WaterPulse color scheme
  const createMarkerIcon = (report: WaterReport, isSelected: boolean) => {
    const isHigh = report.priorityBand === 'High';
    const isMedium = report.priorityBand === 'Medium';
    const isUnverified = report.status === 'Unverified';

    // Fresh aquatic colors
    let pinColor = '#2878C8'; // Ocean blue
    let borderColor = '#173B57';
    if (isHigh) {
      pinColor = '#E76F75'; // Coral alert
      borderColor = '#9C252C';
    } else if (isMedium) {
      pinColor = '#F0B44D'; // Soft amber
      borderColor = '#9C6E19';
    }

    const pinSize = isSelected ? 42 : 34;
    const haloHtml = isSelected
      ? `<span class="absolute -inset-2 rounded-full border-2 border-[${pinColor}] animate-ping opacity-75"></span>`
      : '';

    const badgeIcon = report.schoolDependent
      ? '🏫'
      : report.healthFacilityDependent
      ? '🏥'
      : isUnverified
      ? '?'
      : '💧';

    const html = `
      <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -100%);">
        ${haloHtml}
        <div class="relative flex items-center justify-center rounded-full shadow-md transition-transform duration-150 group-hover:scale-110"
             style="width: ${pinSize}px; height: ${pinSize}px; background-color: ${pinColor}; border: 2.5px solid #ffffff; box-shadow: 0 3px 8px rgba(23, 59, 87, 0.35);">
          <span style="font-size: ${isSelected ? '14px' : '12px'}; color: #ffffff; font-weight: 800; font-family: 'JetBrains Mono', monospace;">
            ${report.priorityScore}
          </span>
          <div class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white flex items-center justify-center text-[9px] shadow-xs border border-[#D9E7F2]">
            ${badgeIcon}
          </div>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${pinColor}; margin-top: -1px;"></div>
      </div>
    `;

    return L.divIcon({
      className: 'waterpulse-custom-marker',
      html,
      iconSize: [pinSize, pinSize + 7],
      iconAnchor: [pinSize / 2, pinSize + 7],
      popupAnchor: [0, -(pinSize + 10)],
    });
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: UGANDA_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // Custom placed zoom control
        attributionControl: false,
      });

      // Add custom attribution bottom-right
      L.control
        .attribution({
          position: 'bottomright',
          prefix: false,
        })
        .addTo(map);

      // OpenStreetMap Standard Tiles
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      });

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayer.addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Handle window or layout resize
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);

      return () => {
        resizeObserver.disconnect();
        map.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      };
    }
  }, [viewMode]);

  // Update map markers when reports change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || viewMode !== 'map') return;

    markersGroup.clearLayers();

    reportsWithCoords.forEach((report) => {
      const lat = report.coordinates!.lat;
      const lng = report.coordinates!.lng;
      const isSelected = selectedReportId === report.reportId;

      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(report, isSelected),
        title: `${report.waterPointName} (${report.reportId})`,
      });

      // Synchronize selection on marker click
      marker.on('click', () => {
        setSelectedReportId(report.reportId);
        setMobileDrawerOpen(true);
      });

      // Sleek popup with structured report summary
      const bandColor = getPriorityBandColor(report.priorityBand);
      const popupContent = document.createElement('div');
      popupContent.className = 'text-xs p-1 space-y-1.5 font-sans';
      popupContent.style.minWidth = '210px';
      popupContent.innerHTML = `
        <div class="flex items-center justify-between pb-1 border-b border-[#D9E7F2]">
          <span class="font-mono font-bold text-[#2878C8] text-[11px]">${report.reportId}</span>
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${bandColor.bg} ${bandColor.text}">
            Score: ${report.priorityScore} (${report.priorityBand})
          </span>
        </div>
        <div class="font-bold text-[#173B57] text-xs">${report.waterPointName}</div>
        <div class="text-[11px] text-[#647B91]">${report.locationName} · ${report.district}</div>
        <div class="flex items-center gap-2 text-[10px] text-[#344B62] pt-1">
          <span>Status: <strong>${report.status}</strong></span>
          <span>·</span>
          <span>Outage: <strong>${report.reportedDurationDays ? `${report.reportedDurationDays}d` : 'recent'}</strong></span>
        </div>
        ${
          report.schoolDependent
            ? '<div class="text-[10px] text-[#0DAB9B] font-semibold flex items-center gap-1">🏫 School Dependent (+15 pts)</div>'
            : ''
        }
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'waterpulse-map-popup',
      });

      markersGroup.addLayer(marker);

      // If this marker is selected, pan map gently and open popup
      if (isSelected) {
        marker.openPopup();
      }
    });
  }, [reportsWithCoords, selectedReportId, viewMode]);

  // Fit bounds to all visible markers
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || reportsWithCoords.length === 0) return;

    const bounds = L.latLngBounds(
      reportsWithCoords.map((r) => [r.coordinates!.lat, r.coordinates!.lng])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
  };

  // Reset view to entire Uganda
  const handleResetUgandaView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView(UGANDA_CENTER, DEFAULT_ZOOM);
    setSelectedReportId(null);
  };

  // Zoom controls
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="space-y-4">
      {/* Header & Alignment Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#173B57]">Uganda Water-Point Geographic Map</h2>
            <span className="text-[11px] font-mono font-semibold text-[#0DAB9B] bg-[#DDF8F0] px-2 py-0.5 rounded">
              SDG 6.1 Spatial Triage
            </span>
          </div>
          <p className="text-xs text-[#647B91] mt-0.5">
            Geospatial visibility for rural and peri-urban water infrastructure breakdowns. Pin color indicates priority severity; click any point to inspect verified details.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 rounded-lg bg-[#E4F0FA] border border-[#D9E7F2]">
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-white text-[#173B57] shadow-xs'
                  : 'text-[#647B91] hover:text-[#173B57]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Map View</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-[#173B57] shadow-xs'
                  : 'text-[#647B91] hover:text-[#173B57]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Alternative</span>
            </button>
          </div>

          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="sm:hidden p-2 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] text-[#344B62]"
            aria-label="Toggle Filter Options"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div
        className={`p-3.5 rounded-xl bg-white border border-[#D9E7F2] shadow-2xs space-y-3 ${
          mobileFiltersOpen ? 'block' : 'hidden sm:block'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search by report or location */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#647B91] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search facility, village, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2878C8]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#647B91] hover:text-[#173B57]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* District filter */}
          <div>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none text-[#344B62]"
            >
              <option value="all">All Administrative Districts</option>
              {availableDistricts.map((d) => (
                <option key={d} value={d}>
                  {d} District
                </option>
              ))}
            </select>
          </div>

          {/* Issue category filter */}
          <div>
            <select
              value={issueFilter}
              onChange={(e) => setIssueFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none text-[#344B62]"
            >
              <option value="all">All Issue Categories</option>
              <option value="broken_pump">Broken Pump / Mechanics</option>
              <option value="no_water_supply">No Water Supply / Dried</option>
              <option value="damaged_infrastructure">Damaged Infrastructure</option>
              <option value="suspected_contamination">Suspected Contamination</option>
              <option value="other_water_access">Other Water Access Barrier</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none text-[#344B62]"
            >
              <option value="all">All Priority Levels</option>
              <option value="High">High Priority (70–100 pts)</option>
              <option value="Medium">Medium Priority (40–69 pts)</option>
              <option value="Low">Low Priority (0–39 pts)</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#D9E7F2] bg-[#F7FAFE] focus:bg-white focus:outline-none text-[#344B62]"
            >
              <option value="all">All Verification Statuses</option>
              <option value="Unverified">Unverified (Pending Review)</option>
              <option value="Verified">Verified by Officer</option>
              <option value="Assigned">Assigned to Repair Team</option>
              <option value="Resolved">Resolved / Operational</option>
            </select>
          </div>
        </div>

        {/* Filter status summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#D9E7F2] text-xs">
          <div className="flex items-center gap-2 text-[#647B91]">
            <span>
              Showing <strong className="text-[#173B57]">{filteredReports.length}</strong> of {reports.length} reports
            </span>
            <span>·</span>
            <span>
              <strong className="text-[#2878C8]">{reportsWithCoords.length}</strong> mapped with GPS coordinates
            </span>
            {reportsWithoutCoords.length > 0 && (
              <>
                <span>·</span>
                <span className="text-[#B87A14]">
                  {reportsWithoutCoords.length} unmapped (no coordinates provided)
                </span>
              </>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-[#2878C8] hover:text-[#173B57] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Map + Right Side Details Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Canvas Container (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-[#D9E7F2] p-3.5 shadow-2xs overflow-hidden flex flex-col">
          {viewMode === 'map' ? (
            <div className="relative w-full h-[540px] md:h-[620px] rounded-lg overflow-hidden border border-[#D9E7F2] bg-[#F0F7FC]">
              {/* Actual Interactive Leaflet Map */}
              <div
                ref={mapContainerRef}
                className="w-full h-full z-0 outline-none"
                style={{ background: '#F0F7FC' }}
              />

              {/* Map Tile Warning Notification (if tile server is slow or blocked) */}
              {tileError && (
                <div className="absolute top-3 left-3 right-16 z-20 p-2.5 rounded-lg bg-[#FEF8EC] border border-[#F9E6C3] text-xs text-[#B87A14] flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#B87A14]" />
                    <span>External map tile server is rate-limited; interactive markers and list alternative remain functional.</span>
                  </div>
                  <button
                    onClick={() => setViewMode('list')}
                    className="px-2 py-0.5 rounded bg-white font-semibold text-xs border border-[#D9E7F2] hover:bg-[#F0F7FC]"
                  >
                    Switch to List
                  </button>
                </div>
              )}

              {/* Top-Right Floating Controls (Fit bounds, Reset, Zoom) */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 shadow-sm">
                <button
                  onClick={handleZoomIn}
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-[#D9E7F2] flex items-center justify-center text-[#173B57] text-base font-bold shadow-xs transition-colors"
                  title="Zoom In"
                  aria-label="Zoom In"
                >
                  +
                </button>
                <button
                  onClick={handleZoomOut}
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-[#D9E7F2] flex items-center justify-center text-[#173B57] text-base font-bold shadow-xs transition-colors"
                  title="Zoom Out"
                  aria-label="Zoom Out"
                >
                  −
                </button>
                <button
                  onClick={handleFitBounds}
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-[#D9E7F2] flex items-center justify-center text-[#2878C8] shadow-xs transition-colors mt-1"
                  title="Fit All Visible Water Points"
                  aria-label="Fit Bounds"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetUgandaView}
                  className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white border border-[#D9E7F2] flex items-center justify-center text-[#173B57] shadow-xs transition-colors"
                  title="Reset to Entire Uganda View"
                  aria-label="Reset View"
                >
                  <Compass className="w-4 h-4" />
                </button>
              </div>

              {/* Bottom-Left WaterPulse Legend */}
              <div className="absolute bottom-3 left-3 z-10 p-3 rounded-lg bg-white/95 backdrop-blur-xs border border-[#D9E7F2] shadow-xs text-xs space-y-1.5 max-w-[240px]">
                <span className="font-bold text-[#173B57] block text-[11px] uppercase tracking-wider">
                  Priority Scoring Key
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#E76F75] border-2 border-white shadow-xs shrink-0" />
                  <span className="text-[#344B62]">High Priority (70–100 pts)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F0B44D] border-2 border-white shadow-xs shrink-0" />
                  <span className="text-[#344B62]">Medium Priority (40–69 pts)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2878C8] border-2 border-white shadow-xs shrink-0" />
                  <span className="text-[#344B62]">Low Priority (0–39 pts)</span>
                </div>
                <div className="pt-1 border-t border-[#D9E7F2] text-[10px] text-[#647B91] flex items-center gap-1.5">
                  <span>🏫 School Impact</span>
                  <span>·</span>
                  <span>🏥 Clinic Impact</span>
                </div>
              </div>

              {/* Empty state overlay when 0 results match */}
              {filteredReports.length === 0 && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-[#B87A14]" />
                  <h3 className="font-bold text-[#173B57] text-sm">No Matching Water Points</h3>
                  <p className="text-xs text-[#647B91] max-w-sm">
                    No reports match your current filter parameters. Try expanding your search or clearing the filters.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2878C8] text-white text-xs font-semibold hover:bg-[#1f63a6] transition-colors mt-2"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* High-Density List Alternative View */
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E7F2] text-xs font-semibold text-[#647B91]">
                <span>All Filtered Water Points ({filteredReports.length})</span>
                <span>Triage Priority</span>
              </div>

              <div className="divide-y divide-[#D9E7F2] max-h-[580px] overflow-y-auto">
                {filteredReports.map((report) => {
                  const bandColor = getPriorityBandColor(report.priorityBand);
                  const isSelected = selectedReport?.reportId === report.reportId;
                  return (
                    <div
                      key={report.reportId}
                      onClick={() => {
                        setSelectedReportId(report.reportId);
                        setMobileDrawerOpen(true);
                      }}
                      className={`p-3 rounded-lg transition-colors cursor-pointer my-1 text-left ${
                        isSelected
                          ? 'bg-[#E4F0FA] border border-[#2878C8]/40 shadow-xs'
                          : 'hover:bg-[#F7FAFE]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-[#647B91] mb-0.5">
                            <span className="font-mono font-bold text-[#2878C8]">{report.reportId}</span>
                            <span>·</span>
                            <span>{report.locationName}</span>
                            <span>·</span>
                            <span>{report.district}</span>
                            {report.isDemo && (
                              <span className="text-[9px] font-mono font-bold text-[#2878C8] bg-white px-1 rounded border border-[#D9E7F2]">
                                DEMO
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-[#173B57] truncate">
                            {report.waterPointName}
                          </h4>
                          <p className="text-xs text-[#647B91] line-clamp-1 mt-0.5">
                            {report.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[#647B91]">
                            <span className="font-semibold text-[#344B62]">{report.status}</span>
                            <span>·</span>
                            <span>{report.issueType.replace('_', ' ')}</span>
                            <span>·</span>
                            <span>{report.reportedDurationDays ? `${report.reportedDurationDays}d outage` : 'recent'}</span>
                            {report.coordinates ? (
                              <span className="font-mono text-[10px] text-[#2878C8]">
                                GPS: {report.coordinates.lat.toFixed(4)}, {report.coordinates.lng.toFixed(4)}
                              </span>
                            ) : (
                              <span className="text-[#B87A14] text-[10px]">No GPS Coordinates</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2.5 py-1 rounded text-xs font-mono font-bold ${bandColor.bg} ${bandColor.text} border ${bandColor.border}`}
                          >
                            {report.priorityScore} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredReports.length === 0 && (
                  <div className="p-12 text-center text-xs text-[#647B91]">
                    No water points match the active filter criteria.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unmapped Reports Notice Strip (below map) */}
          {reportsWithoutCoords.length > 0 && viewMode === 'map' && (
            <div className="mt-3 p-3 rounded-lg bg-[#FEF8EC] border border-[#F9E6C3] text-xs text-[#B87A14] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#B87A14] shrink-0" />
                <span>
                  <strong>{reportsWithoutCoords.length} report(s)</strong> do not have GPS coordinates and cannot be pinned to the map:
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {reportsWithoutCoords.map((r) => (
                  <button
                    key={r.reportId}
                    onClick={() => {
                      setSelectedReportId(r.reportId);
                      setMobileDrawerOpen(true);
                    }}
                    className="px-2 py-0.5 rounded bg-white text-xs font-mono text-[#173B57] border border-[#D9E7F2] hover:bg-[#F0F7FC] whitespace-nowrap"
                  >
                    {r.reportId}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side Report Details Panel (Desktop, 4 cols) */}
        <div className="hidden lg:block lg:col-span-4 bg-white rounded-xl border border-[#D9E7F2] p-5 shadow-2xs space-y-4">
          {selectedReport ? (
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[#D9E7F2]">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#647B91]">
                    <span className="font-mono font-bold text-[#2878C8]">{selectedReport.reportId}</span>
                    <span>·</span>
                    <span className="font-mono text-[10px] text-[#2878C8] bg-[#F0F7FC] px-1.5 py-0.5 rounded border border-[#D9E7F2]">
                      isDemo: true
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#173B57] mt-1">
                    {selectedReport.waterPointName}
                  </h3>
                  <p className="text-xs text-[#647B91]">
                    {selectedReport.locationName} ({selectedReport.district})
                  </p>
                </div>

                <button
                  onClick={() => setSelectedReportId(null)}
                  className="p-1 rounded-md text-[#647B91] hover:text-[#173B57] hover:bg-[#F0F7FC]"
                  title="Close Selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Priority & Status Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2]">
                  <span className="text-[11px] text-[#647B91] block">Triage Priority</span>
                  <span className="text-lg font-extrabold font-mono text-[#2878C8]">
                    {selectedReport.priorityScore} / 100
                  </span>
                  <span className="text-[10px] font-bold text-[#173B57] block">
                    {selectedReport.priorityBand} Band
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F7FAFE] border border-[#D9E7F2]">
                  <span className="text-[11px] text-[#647B91] block">Workflow Status</span>
                  <span className="text-sm font-bold text-[#173B57] block mt-1">
                    {selectedReport.status}
                  </span>
                  <span className="text-[10px] text-[#647B91] block">
                    {selectedReport.assignedTo ? 'Crew Assigned' : 'Awaiting Action'}
                  </span>
                </div>
              </div>

              {/* Technical breakdown */}
              <div className="space-y-2 text-xs divide-y divide-[#D9E7F2]">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#647B91]">Fault Category:</span>
                  <span className="font-semibold text-[#173B57] capitalize">
                    {selectedReport.issueType.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#647B91]">Reported Outage Duration:</span>
                  <span className="font-semibold text-[#173B57]">
                    {selectedReport.reportedDurationDays ? `${selectedReport.reportedDurationDays} days` : 'Not stated'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#647B91]">Beneficiaries Affected:</span>
                  <span className="font-semibold text-[#173B57]">
                    ~{selectedReport.estimatedPeopleAffected ?? 'Unknown'} people
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#647B91]">School Dependency (SDG 4):</span>
                  <span className="font-semibold text-[#0DAB9B]">
                    {selectedReport.schoolDependent ? `Yes (+15 pts)` : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-[#647B91]">Health Facility Dependency:</span>
                  <span className="font-semibold text-[#2878C8]">
                    {selectedReport.healthFacilityDependent ? `Yes (+15 pts)` : 'No'}
                  </span>
                </div>

                {selectedReport.coordinates && (
                  <div className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                    <span className="text-[#647B91]">GPS Coordinates:</span>
                    <span className="text-[#173B57]">
                      {selectedReport.coordinates.lat.toFixed(4)}, {selectedReport.coordinates.lng.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Citizen Description Quote */}
              <div className="p-3 rounded-lg bg-[#F7FAFE] border border-[#D9E7F2] text-xs">
                <span className="font-bold text-[#173B57] block mb-1">Citizen Problem Statement:</span>
                <p className="italic text-[#344B62]">"{selectedReport.description}"</p>
              </div>

              {/* Reviewer Action CTA */}
              <button
                onClick={() => {
                  if (onSelectReportForReview) {
                    onSelectReportForReview(selectedReport.reportId);
                  }
                  setActiveTab('reviewer_queue');
                }}
                className="w-full py-2 bg-[#2878C8] hover:bg-[#1f63a6] text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Inspect in Reviewer Queue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#647B91] space-y-2">
              <MapPin className="w-8 h-8 text-[#2878C8] mx-auto opacity-70" />
              <h4 className="font-bold text-[#173B57]">No Water Point Selected</h4>
              <p className="text-[11px] leading-relaxed">
                Click any priority pin on the interactive map or select a row in the list view to inspect verified engineering details, beneficiary estimates, and workflow actions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Touch-Friendly Bottom Drawer */}
      {mobileDrawerOpen && selectedReport && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 p-4 bg-white border-t border-[#D9E7F2] shadow-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#D9E7F2]">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#2878C8] text-xs">{selectedReport.reportId}</span>
              <span className="text-xs font-bold text-[#173B57]">{selectedReport.status}</span>
            </div>
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="p-1 rounded text-[#647B91]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="font-bold text-sm text-[#173B57]">{selectedReport.waterPointName}</h3>
          <p className="text-xs text-[#647B91]">{selectedReport.locationName} · {selectedReport.district}</p>

          <div className="p-2.5 rounded-lg bg-[#F0F7FC] border border-[#D9E7F2] flex items-center justify-between text-xs">
            <span>Priority Score: <strong className="font-mono text-[#2878C8]">{selectedReport.priorityScore} / 100</strong></span>
            <span className="font-bold text-[#173B57]">{selectedReport.priorityBand} Band</span>
          </div>

          <p className="text-xs italic text-[#344B62] bg-[#F7FAFE] p-2.5 rounded border border-[#D9E7F2]">
            "{selectedReport.description}"
          </p>

          <button
            onClick={() => {
              if (onSelectReportForReview) {
                onSelectReportForReview(selectedReport.reportId);
              }
              setActiveTab('reviewer_queue');
            }}
            className="w-full py-2 bg-[#2878C8] text-white font-semibold text-xs rounded-lg text-center"
          >
            Open in Reviewer Queue
          </button>
        </div>
      )}
    </div>
  );
};
