"use client";

import { useEffect, useState } from "react";
import { getStates, request, adminCreateDistrict, adminUpdateDistrict, adminDeleteDistrict } from "@/lib/api";
import { Plus, Edit3, Trash2, X, AlertCircle, Eye } from "lucide-react";

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<any>(null);
  
  // Filtering
  const [selectedStateFilter, setSelectedStateFilter] = useState("");

  // Form fields
  const [stateId, setStateId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [overview, setOverview] = useState("");
  const [famousPlaces, setFamousPlaces] = useState<any[]>([]); // [{"name": "", "description": ""}]
  const [railwayStations, setRailwayStations] = useState(""); // Comma separated string for simplicity
  const [industriesOverview, setIndustriesOverview] = useState("");
  const [odopName, setOdopName] = useState("");
  const [odopDesc, setOdopDesc] = useState("");
  const [odopImageUrl, setOdopImageUrl] = useState("");
  
  // Emergency contacts
  const [police, setPolice] = useState("");
  const [fire, setFire] = useState("");
  const [ambulance, setAmbulance] = useState("");
  const [helpline, setHelpline] = useState("");
  
  const [mostSearchedQueries, setMostSearchedQueries] = useState(""); // Comma separated
  const [error, setError] = useState("");
  const [formTab, setFormTab] = useState<"basic" | "intelligence" | "odop">("basic");

  const loadData = async () => {
    setLoading(true);
    try {
      const statesData = await getStates();
      setStates(statesData || []);
      
      const distData = await request("/api/districts");
      setDistricts(distData || []);
    } catch (err: any) {
      console.error("Failed to load districts:", err);
      setError("Failed to fetch database information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingDistrict(null);
    setStateId(states[0]?.id || "");
    setName("");
    setSlug("");
    setOverview("");
    setFamousPlaces([{ name: "", description: "" }]);
    setRailwayStations("");
    setIndustriesOverview("");
    setOdopName("");
    setOdopDesc("");
    setOdopImageUrl("");
    setPolice("");
    setFire("");
    setAmbulance("");
    setHelpline("");
    setMostSearchedQueries("");
    setError("");
    setFormTab("basic");
    setModalOpen(true);
  };

  const openEditModal = (dist: any) => {
    setEditingDistrict(dist);
    setStateId(dist.state_id);
    setName(dist.name);
    setSlug(dist.slug);
    setOverview(dist.overview || "");
    setFamousPlaces(dist.famous_places && dist.famous_places.length > 0 ? dist.famous_places : [{ name: "", description: "" }]);
    setRailwayStations((dist.railway_stations || []).join(", "));
    setIndustriesOverview(dist.industries_overview || "");
    setOdopName(dist.odop?.product_name || "");
    setOdopDesc(dist.odop?.description || "");
    setOdopImageUrl(dist.odop?.image_url || "");
    setPolice(dist.emergency_contacts?.police || "");
    setFire(dist.emergency_contacts?.fire || "");
    setAmbulance(dist.emergency_contacts?.ambulance || "");
    setHelpline(dist.emergency_contacts?.helpline || "");
    setMostSearchedQueries((dist.most_searched_queries || []).join(", "));
    setError("");
    setFormTab("basic");
    setModalOpen(true);
  };

  // Generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!editingDistrict) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
      );
    }
  };

  // Famous places builders
  const handlePlaceChange = (index: number, field: string, value: string) => {
    const updated = [...famousPlaces];
    updated[index][field] = value;
    setFamousPlaces(updated);
  };

  const addPlaceRow = () => {
    setFamousPlaces([...famousPlaces, { name: "", description: "" }]);
  };

  const removePlaceRow = (index: number) => {
    setFamousPlaces(famousPlaces.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Prepare arrays/JSON payloads
    const parsedStations = railwayStations
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== "");
      
    const parsedQueries = mostSearchedQueries
      .split(",")
      .map((q) => q.trim())
      .filter((q) => q !== "");

    const payload = {
      state_id: stateId,
      name,
      slug,
      overview,
      famous_places: famousPlaces.filter((p) => p.name.trim() !== ""),
      railway_stations: parsedStations,
      industries_overview: industriesOverview,
      odop: {
        product_name: odopName,
        description: odopDesc,
        image_url: odopImageUrl,
      },
      emergency_contacts: {
        police,
        fire,
        ambulance,
        helpline,
      },
      most_searched_queries: parsedQueries,
    };

    const token = localStorage.getItem("token") || "";

    try {
      if (editingDistrict) {
        await adminUpdateDistrict(editingDistrict.id, payload, token);
      } else {
        await adminCreateDistrict(payload, token);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving district.");
    }
  };

  const handleDelete = async (id: string, distName: string) => {
    if (!confirm(`Are you sure you want to delete district "${distName}"? This will delete all its services recursively.`)) {
      return;
    }
    
    setError("");
    const token = localStorage.getItem("token") || "";
    try {
      await adminDeleteDistrict(id, token);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete district. Check permissions.");
    }
  };

  // Filter districts list
  const filteredDistricts = selectedStateFilter
    ? districts.filter((d) => d.state_id === selectedStateFilter)
    : districts;

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">District Directory Management</h1>
          <p className="text-xs text-slate-500">Manage district intelligence sheets, tourist landmarks, emergency lines, and products</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={states.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4.5 w-4.5" />
          Add District
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/20 bg-red-950/10 p-4 text-xs font-semibold text-red-500 flex items-start gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Content panel */}
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter State:</label>
          <select
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Districts list table */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading districts data...</div>
          ) : filteredDistricts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No districts match the criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                    <th className="p-4">District Name</th>
                    <th className="p-4">Associated State</th>
                    <th className="p-4">ODOP Product</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredDistricts.map((dist) => {
                    const stateName = states.find((s) => s.id === dist.state_id)?.name || "Unknown State";
                    return (
                      <tr key={dist.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                        <td className="p-4 font-bold text-slate-900 dark:text-white">{dist.name}</td>
                        <td className="p-4 font-semibold text-slate-600 dark:text-slate-400">{stateName}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">{dist.odop?.product_name || "-"}</td>
                        <td className="p-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(dist)}
                            className="rounded-lg border border-slate-205 p-2 text-slate-650 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(dist.id, dist.name)}
                            className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 dark:border-red-950/30 dark:hover:bg-red-950/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingDistrict ? `Edit District: ${editingDistrict.name}` : "Add New District"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tab Controls */}
            <div className="flex border-b border-slate-100 px-6 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setFormTab("basic")}
                className={`py-3 text-xs font-bold border-b-2 px-3 ${
                  formTab === "basic" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                1. Basic Info
              </button>
              <button
                type="button"
                onClick={() => setFormTab("intelligence")}
                className={`py-3 text-xs font-bold border-b-2 px-3 ${
                  formTab === "intelligence" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                2. Intelligence Info
              </button>
              <button
                type="button"
                onClick={() => setFormTab("odop")}
                className={`py-3 text-xs font-bold border-b-2 px-3 ${
                  formTab === "odop" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                3. ODOP & Emergency
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* TAB 1: Basic Info */}
              {formTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated State</label>
                      <select
                        value={stateId}
                        onChange={(e) => setStateId(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      >
                        {states.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">District Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={handleNameChange}
                        placeholder="e.g. Varanasi"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">URL Slug</label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="e.g. varanasi"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overview Summary</label>
                    <textarea
                      rows={4}
                      value={overview}
                      onChange={(e) => setOverview(e.target.value)}
                      placeholder="Write a brief spiritual, administrative, or geographical overview of the district..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Intelligence Info */}
              {formTab === "intelligence" && (
                <div className="space-y-4">
                  {/* Famous Places Rows */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Famous Places & Landmarks</label>
                      <button
                        type="button"
                        onClick={addPlaceRow}
                        className="text-xs font-bold text-blue-600 hover:underline"
                      >
                        + Add Place
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-3 dark:border-slate-850 dark:bg-slate-950/20">
                      {famousPlaces.map((place, idx) => (
                        <div key={idx} className="flex gap-2 items-start border-b border-slate-100 pb-2 dark:border-slate-850">
                          <div className="flex-1 space-y-1.5">
                            <input
                              type="text"
                              placeholder="Landmark name (e.g. Sarnath)..."
                              value={place.name}
                              onChange={(e) => handlePlaceChange(idx, "name", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                            <input
                              type="text"
                              placeholder="Brief description..."
                              value={place.description}
                              onChange={(e) => handlePlaceChange(idx, "description", e.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                            />
                          </div>
                          {famousPlaces.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePlaceRow(idx)}
                              className="text-red-500 hover:text-red-650 p-1 mt-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Railway Stations (Comma Separated)</label>
                    <input
                      type="text"
                      value={railwayStations}
                      onChange={(e) => setRailwayStations(e.target.value)}
                      placeholder="Varanasi Junction (BSB), Banaras Railway Station (BSBS)"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Industries Overview</label>
                    <textarea
                      rows={3}
                      value={industriesOverview}
                      onChange={(e) => setIndustriesOverview(e.target.value)}
                      placeholder="Describe the prominent factories, handloom sectors, IT parks, or industrial profile..."
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: ODOP & Emergency */}
              {formTab === "odop" && (
                <div className="space-y-4">
                  {/* ODOP */}
                  <div className="rounded-xl border p-4 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/20">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">One District One Product (ODOP)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Product Name (e.g. Silk Sarees)..."
                        value={odopName}
                        onChange={(e) => setOdopName(e.target.value)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Image URL..."
                        value={odopImageUrl}
                        onChange={(e) => setOdopImageUrl(e.target.value)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                      />
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Product Description..."
                      value={odopDesc}
                      onChange={(e) => setOdopDesc(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>

                  {/* Emergencies */}
                  <div className="rounded-xl border p-4 bg-slate-50/50 dark:border-slate-850 dark:bg-slate-950/20">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Emergency Contacts</h4>
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Police</label>
                        <input
                          type="text"
                          value={police}
                          onChange={(e) => setPolice(e.target.value)}
                          placeholder="e.g. 112"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Fire</label>
                        <input
                          type="text"
                          value={fire}
                          onChange={(e) => setFire(e.target.value)}
                          placeholder="e.g. 101"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Ambulance</label>
                        <input
                          type="text"
                          value={ambulance}
                          onChange={(e) => setAmbulance(e.target.value)}
                          placeholder="e.g. 108"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-bold">Helpline</label>
                        <input
                          type="text"
                          value={helpline}
                          onChange={(e) => setHelpline(e.target.value)}
                          placeholder="e.g. 1090"
                          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Most Searched Queries (Comma Separated)</label>
                    <input
                      type="text"
                      value={mostSearchedQueries}
                      onChange={(e) => setMostSearchedQueries(e.target.value)}
                      placeholder="Best handlooms in Varanasi, Payment guides for water bills UP"
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer buttons */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-4 dark:border-slate-800">
                {/* Navigation helpers inside modal */}
                <div className="flex gap-2">
                  {formTab !== "basic" && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === "odop" ? "intelligence" : "basic")}
                      className="rounded-lg border px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-950"
                    >
                      Back
                    </button>
                  )}
                  {formTab !== "odop" && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === "basic" ? "intelligence" : "odop")}
                      className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-[11px] font-bold hover:bg-slate-805 dark:bg-slate-100 dark:text-slate-950"
                    >
                      Next
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-950"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Save District
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
