import { useEffect, useState } from "react";
import { fetchPetData, getCachedPetData } from "./fetchPetData";

export const useMongoPetData = () => {
  const [data, setData] = useState(() => getCachedPetData());
  const [loading, setLoading] = useState(() => getCachedPetData() === null);

  useEffect(() => {
    if (!data) {
      fetchPetData().then(d => {
        setData(d);
        setLoading(false);
      });
    }
  }, [data]);

  return { data, loading };
};
