import React, { useState } from "react";
import api from "../../services/api";

const SearchAssistant = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/rag/search", { query });
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          className="border border-gray-300 rounded-lg px-4 py-2 flex-1"
          placeholder="Search for products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {results && Array.isArray(results.results) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.results.map((item, index) => (
            <div
              key={index}
              className="border rounded-xl shadow p-4 hover:shadow-lg transition-all bg-white"
            >
              <h2 className="font-semibold text-lg text-gray-900">
                {item.name}
              </h2>
              <p className="text-sm text-gray-500 mb-2">{item.category}</p>
              <p className="text-gray-700 text-sm">{item.summary}</p>
            </div>
          ))}
        </div>
      ) : (
        results && (
          <div className="bg-gray-50 border rounded-lg p-4 text-gray-700 whitespace-pre-line">
            {results.results}
          </div>
        )
      )}
    </div>
  );
};

export default SearchAssistant;
