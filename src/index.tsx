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

// Same markup as Stash's own stash-id pill, so it looks built in.
const ScoutPill = ({
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
  );
};

// patch.after: (props, _ctx, result). Find the panel's "stash_ids" DetailItem in the
// result and append our pill to its <ul>. We only add to whatever the previous patch
// returned, so other plugins doing the same compose. If the shape isn't what we
// expect, leave the original untouched.
const append = (name: string, kind: "performers" | "studios", prop: string) =>
  PluginApi.patch.after(name, (props: any, _ctx: any, result: any) => {
    if (!React.isValidElement(result)) return [result];
    const pill = (
      <ScoutPill key="scout-plugin" kind={kind} stashIds={props[prop]?.stash_ids} />
    );
    const items = React.Children.toArray((result as any).props.children);
    let found = false;
    const next = items.map((item: any) => {
      const list = item?.props?.id === "stash_ids" ? item.props.value : null;
      if (!React.isValidElement(list)) return item;
      found = true;
      return React.cloneElement(item, {
        value: React.cloneElement(
          list as React.ReactElement<any>,
          undefined,
          ...React.Children.toArray((list as any).props.children),
          pill
        ),
      });
    });
    return [
      found
        ? React.cloneElement(result as React.ReactElement<any>, undefined, ...next)
        : result,
    ];
  });

append("PerformerDetailsPanel", "performers", "performer");
append("StudioDetailsPanel", "studios", "studio");
