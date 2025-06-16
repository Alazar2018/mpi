import type { Match } from "@/interface";
import { getApi } from "@/utils/utils";

const api = getApi('/matches')

export function getAllMatchs(query = {}) {
	return api.addAuthenticationHeader().get<{matches: Match[]}>('', {
		params: query
	})
}