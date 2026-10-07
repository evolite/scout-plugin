import React from "react";
import "./styles.css";

const PluginApi: any = (window as any).PluginApi ?? (window as any).stash;
const PLUGIN_ID = "scout-plugin";
const CACHE_KEY = "scout-plugin:scoutUrl";

const readCache = () => {
  try {
    return localStorage.getItem(CACHE_KEY) ?? "";
  } catch {
    return "";
  }
};

// Refetched on every link mount so settings changes apply without a page reload;
// the server value wins over the cache.
let scoutUrl = readCache();
const refresh = (): Promise<void> =>
  fetch(`${PluginApi.baseURL ?? ""}/graphql`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "{ configuration { plugins } }" }),
})
  .then((r) => r.json())
  .then((d) => {
    scoutUrl = d?.data?.configuration?.plugins?.[PLUGIN_ID]?.scoutUrl ?? "";
    try {
      localStorage.setItem(CACHE_KEY, scoutUrl);
    } catch {}
  })
  .catch(() => {});

type StashId = { endpoint: string; stash_id: string };

const ScoutLink = ({
  kind,
  stashIds,
}: {
  kind: "performers" | "studios";
  stashIds?: StashId[];
}) => {
  const [, rerender] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    refresh().then(rerender);
  }, []);
  const id = stashIds?.find((s) => /stashdb\.org/i.test(s.endpoint))?.stash_id;
  if (!scoutUrl || !id) return null;
  return (
    <div className="scout-plugin-link">
      <a
        href={`${scoutUrl.replace(/\/+$/, "")}/${kind}/${id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open in Stash Scout
      </a>
    </div>
  );
};

// patch.after: (props, _ctx, result) — spread result to keep the original render.
const append = (name: string, kind: "performers" | "studios", prop: string) =>
  PluginApi.patch.after(name, (props: any, _ctx: any, result: any) => [
    <React.Fragment key="scout-plugin">
      {result}
      <ScoutLink kind={kind} stashIds={props[prop]?.stash_ids} />
    </React.Fragment>,
  ]);

append("PerformerDetailsPanel", "performers", "performer");
append("StudioDetailsPanel", "studios", "studio");
