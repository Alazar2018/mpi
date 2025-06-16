import type { AsyncResponse } from "@/interface";
import type { AxiosError, AxiosResponse } from "axios";

export async function responseHandler<T>(
  request: Promise<AxiosResponse<T>>
): Promise<AsyncResponse<T>> {
  try {
    const res = await request;
    return {
      status: 200,
      data: res.data as T,
      success: true,
      error: "",
    };
  } catch (error: any) {
    // this is true when the request gets to the server
    // and there is some error on the server
    if (error.response) {
      let errMsg =
        (error.response?.data?.substr
          ? error.response.data.substr(6)
          : error.response?.data?.message) || error.message;
      // toasted(false, "", errMsg);
      return {
        success: false,
        status: error.response.status,
        error: errMsg,
      };
    }
    // this is true when the request cant get to the server
    // eg. connection error
    if (error.request) {
      if (error.code != "ERR_CANCELED") {
        // toasted(false, "", error.message);
      }

      return {
        success: false,
        status: error.code,
        error: error.message,
      };
    }
  }

  return {
    success: false,
    status: 500,
    error: "Unexpected error",
  };
}
