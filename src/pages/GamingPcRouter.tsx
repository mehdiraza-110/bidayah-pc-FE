import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Loader } from '@/components/ui/Loader';
import { getPublicPcSeriesBySlug, type PcSeries } from '@/services/api';
import { isUuid } from '@/lib/slug';
import GamingPcDetail from './GamingPcDetail';
import PcSeriesLanding from './PcSeriesLanding';

// Featured Gaming PCs and PC Series both live under /gaming-pc/<slug> (same
// convention as hyperpc.ae: /gaming-pc/play is a series, /gaming-pc/<other
// slug> is a single curated build) — this resolves which one a given slug is
// before rendering, since they're two unrelated tables with independent slugs.
const GamingPcRouter: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // undefined = still resolving; null = not a PC series (render the existing
  // Featured Gaming PC page, which does its own id/slug lookup + 404 handling).
  const [series, setSeries] = useState<PcSeries | null | undefined>(undefined);

  useEffect(() => {
    // A raw uuid is always a legacy Featured Gaming PC link — series are only
    // ever linked to by slug, so skip the extra request in that case.
    if (!id || isUuid(id)) {
      setSeries(null);
      return;
    }

    let cancelled = false;
    setSeries(undefined);

    getPublicPcSeriesBySlug(id).then((response) => {
      if (cancelled) return;
      setSeries(response.success && response.data ? response.data : null);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (series === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader label="Loading..." />
        </div>
      </div>
    );
  }

  return series ? <PcSeriesLanding series={series} /> : <GamingPcDetail />;
};

export default GamingPcRouter;
