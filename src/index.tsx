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

// Mirrors Stash's own "Stash IDs" row (detail-item + stash-id-pill) so it looks built in.
const ScoutRow = ({
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
    <div className="detail-item scout_link">
      <span className="detail-item-title scout-link">Stash Scout:</span>
      <span className="detail-item-value scout-link">
        <ul className="pl-0">
          <li className="row no-gutters">
            <span className="stash-id-pill" data-endpoint="Scout">
              <span>Scout</span>
              <a
                href={`${scoutUrl.replace(/\/+$/, "")}/${kind}/${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {id}
              </a>
            </span>
          </li>
        </ul>
      </span>
    </div>
  );
};

// patch.after: (props, _ctx, result). The panel's result is the wrapper element
// holding the detail items, so clone it with our row as the last child (right
// after "Stash IDs"). Fall back to a sibling if the shape is unexpected.
const append = (name: string, kind: "performers" | "studios", prop: string) =>
  PluginApi.patch.after(name, (props: any, _ctx: any, result: any) => {
    const row = (
      <ScoutRow key="scout-plugin" kind={kind} stashIds={props[prop]?.stash_ids} />
    );
    if (React.isValidElement(result)) {
      return [
        React.cloneElement(
          result as React.ReactElement<any>,
          undefined,
          ...React.Children.toArray((result as any).props.children),
          row
        ),
      ];
    }
    return [<React.Fragment key="scout-plugin">{result}{row}</React.Fragment>];
  });

append("PerformerDetailsPanel", "performers", "performer");
append("StudioDetailsPanel", "studios", "studio");
