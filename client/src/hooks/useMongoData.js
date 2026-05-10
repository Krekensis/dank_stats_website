import { useEffect, useState } from "react";
import { fetchItemData, getCachedData } from "./fetchItemData";

export const useMongoData = () => {
  const [data, setData] = useState(() => getCachedData());
  const [loading, setLoading] = useState(() => getCachedData() === null);

  useEffect(() => {
    if (!data) {
      fetchItemData().then(d => {
        setData(d);
        setLoading(false);
      });
    }
  }, [data]);

  return { data, loading };
};
