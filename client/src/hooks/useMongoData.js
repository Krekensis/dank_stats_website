import { useEffect, useState } from "react";
import { fetchItemData } from "./fetchitemdata";

export const useMongoData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItemData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return { data, loading };
};
