import countryCodes from './countryPhones';
import type { SearchableOption } from '@/components/form/SearchableSelect';

// Convert country phone data to searchable select options
export function getCountryOptions(): SearchableOption[] {
  return countryCodes.map((country) => ({
    label: country.name,
    value: country.country, // Use country code (e.g., "US", "CA", "GB")
    flag: country.flag,
    searchTerms: [
      country.name,
      country.country,
      country.code,
      // Add common alternative names for better search
      ...(getAlternativeNames(country.name) || [])
    ]
  }));
}

// Add alternative names for better search experience
function getAlternativeNames(countryName: string): string[] {
  const alternatives: Record<string, string[]> = {
    "United States": ["USA", "America", "US"],
    "United Kingdom": ["UK", "Britain", "England", "Great Britain"],
    "Russia": ["Russian Federation"],
    "South Korea": ["Korea"],
    "North Korea": ["Korea"],
    "Czech Republic": ["Czechia"],
    "Democratic Republic of the Congo": ["Congo", "DRC"],
    "Republic of the Congo": ["Congo"],
    "Iran": ["Persia"],
    "Myanmar": ["Burma"],
    "Macedonia": ["North Macedonia"],
    "Ivory Coast": ["Cote d'Ivoire"],
    "East Timor": ["Timor-Leste"],
    "Vatican City": ["Holy See"],
    "Swaziland": ["Eswatini"],
    "Cape Verde": ["Cabo Verde"]
  };

  return alternatives[countryName] || [];
}

// Get country by code
export function getCountryByCode(code: string): SearchableOption | undefined {
  const countries = getCountryOptions();
  return countries.find(country => country.value === code);
}

// Get country by name
export function getCountryByName(name: string): SearchableOption | undefined {
  const countries = getCountryOptions();
  return countries.find(country => 
    country.label.toLowerCase() === name.toLowerCase() ||
    country.searchTerms?.some(term => term.toLowerCase() === name.toLowerCase())
  );
}

// Get popular countries (commonly used ones first)
export function getPopularCountries(): SearchableOption[] {
  const popularCodes = [
    "US", "CA", "GB", "AU", "DE", "FR", "JP", "BR", "IN", "CN",
    "IT", "ES", "MX", "RU", "KR", "NL", "SE", "NO", "DK", "FI"
  ];
  
  const allCountries = getCountryOptions();
  const popular = popularCodes
    .map(code => allCountries.find(country => country.value === code))
    .filter(Boolean) as SearchableOption[];
  
  const remaining = allCountries.filter(
    country => !popularCodes.includes(country.value)
  );
  
  return [...popular, ...remaining];
}

// Default export for easy importing
export default {
  getCountryOptions,
  getCountryByCode,
  getCountryByName,
  getPopularCountries
};
