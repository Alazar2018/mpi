// Demo component showing SearchableSelect usage
// This demonstrates the country selection functionality

import SearchableSelect from "@/components/form/SearchableSelect";
import { getPopularCountries, getCountryByCode } from "@/utils/countries";

// Example usage in a form component
export function CountrySelectionDemo() {
  const countries = getPopularCountries();

  return (
    <div className="p-6 max-w-md">
      <h2 className="text-xl font-bold mb-4">Country Selection Demo</h2>
      
      <SearchableSelect
        label="Country"
        validation={{ required: "Please select a country" }}
        options={countries}
        placeholder="Search and select your country"
        name="country"
        onUpdate={(value) => {
          console.log("Selected country:", value);
          const country = getCountryByCode(value);
          console.log("Country details:", country);
        }}
      />
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Features:</strong></p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>🔍 Type to search countries</li>
          <li>🏳️ Country flags displayed</li>
          <li>🌟 Popular countries listed first</li>
          <li>🔤 Search by name, code, or alternative names</li>
          <li>⌨️ Keyboard navigation support</li>
          <li>📱 Mobile-friendly interface</li>
        </ul>
      </div>
    </div>
  );
}

// Example search terms that work:
export const searchExamples = {
  "United States": [
    "united states", "usa", "america", "us", "🇺🇸"
  ],
  "United Kingdom": [
    "united kingdom", "uk", "britain", "england", "great britain", "🇬🇧"
  ],
  "Germany": [
    "germany", "deutschland", "de", "🇩🇪"
  ],
  "Japan": [
    "japan", "jp", "🇯🇵"
  ],
  "Russia": [
    "russia", "russian federation", "ru", "🇷🇺"
  ],
  "South Korea": [
    "south korea", "korea", "kr", "🇰🇷"
  ]
};

// Test data showing the country options structure
export const countryDataExample = {
  // Popular countries (shown first)
  popular: [
    {
      label: "United States",
      value: "US",
      flag: "🇺🇸",
      searchTerms: ["United States", "US", "+1", "USA", "America"]
    },
    {
      label: "Canada", 
      value: "CA",
      flag: "🇨🇦",
      searchTerms: ["Canada", "CA", "+1"]
    },
    {
      label: "United Kingdom",
      value: "GB", 
      flag: "🇬🇧",
      searchTerms: ["United Kingdom", "GB", "+44", "UK", "Britain", "England", "Great Britain"]
    }
  ],
  
  // All countries are sorted alphabetically after popular ones
  totalCount: "195+ countries available",
  
  // Search functionality
  searchFeatures: [
    "Country name (e.g., 'Germany')",
    "Country code (e.g., 'DE', 'US')", 
    "Phone code (e.g., '+49', '+1')",
    "Alternative names (e.g., 'USA' for United States)",
    "Partial matches (e.g., 'king' matches 'United Kingdom')"
  ]
};

// Usage in forms
export const formUsageExample = `
// Import the components
import SearchableSelect from "@/components/form/SearchableSelect";
import { getPopularCountries } from "@/utils/countries";

// In your form component
function AddressForm() {
  const countries = getPopularCountries();
  
  return (
    <Form>
      <SearchableSelect
        label="Country"
        validation={{ required }}
        options={countries}
        placeholder="Search and select your country"
        name="country"
      />
    </Form>
  );
}
`;

// Integration with react-hook-form
export const reactHookFormExample = `
// The SearchableSelect automatically integrates with react-hook-form
// through the Form context, providing:

1. Automatic validation
2. Error message display  
3. Form state management
4. Value updates via setValue
5. Watch functionality for real-time updates

// The selected value will be the country code (e.g., "US", "CA", "GB")
// which matches the Address interface in the auth store.
`;

export default {
  CountrySelectionDemo,
  searchExamples,
  countryDataExample,
  formUsageExample,
  reactHookFormExample
};
