import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExtensionBridge } from 'extension-bridge';
import type { ExtensionInfo, ExtensionIndexEntry } from '@/types/extensions';
import type { ExtensionRepo } from '@db/schema';
import {
  addRepo,
  getAllRepos,
  removeRepo,
  toggleRepo,
} from '@db/queries/repos';

// ─── Query key namespace ──────────────────────────────────────────────────────

export const extensionKeys = {
  all: ['extensions'] as const,
  installed: () => [...extensionKeys.all, 'installed'] as const,
  repos: () => [...extensionKeys.all, 'repos'] as const,
  index: (repoUrl: string) => [...extensionKeys.all, 'index', repoUrl] as const,
  merged: () => [...extensionKeys.all, 'merged'] as const,
};

// ─── Repo index fetcher ───────────────────────────────────────────────────────

export async function fetchRepoIndex(repoUrl: string): Promise<ExtensionIndexEntry[]> {
  const res = await fetch(repoUrl);
  if (!res.ok) throw new Error(`Failed to fetch index from ${repoUrl}: ${res.status}`);
  return res.json() as Promise<ExtensionIndexEntry[]>;
}

// ─── Repo hooks ───────────────────────────────────────────────────────────────

export function useRepos() {
  return useQuery({
    queryKey: extensionKeys.repos(),
    queryFn: getAllRepos,
    staleTime: Infinity,
  });
}

export function useAddRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) => addRepo(url, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extensionKeys.repos() });
      queryClient.invalidateQueries({ queryKey: extensionKeys.merged() });
    },
  });
}

export function useRemoveRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => removeRepo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extensionKeys.repos() });
      queryClient.invalidateQueries({ queryKey: extensionKeys.merged() });
    },
  });
}

export function useToggleRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => toggleRepo(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extensionKeys.repos() });
      queryClient.invalidateQueries({ queryKey: extensionKeys.merged() });
    },
  });
}

// ─── Installed extension hooks ────────────────────────────────────────────────

export function useInstalledExtensions() {
  return useQuery({
    queryKey: extensionKeys.installed(),
    queryFn: () => ExtensionBridge.getInstalledExtensions(),
    staleTime: 30_000,
  });
}

export function useInstallExtension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ apkUrl, pkgName }: { apkUrl: string; pkgName: string }) =>
      ExtensionBridge.installExtension(apkUrl, pkgName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extensionKeys.installed() });
    },
  });
}

export function useUninstallExtension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pkgName: string) => ExtensionBridge.uninstallExtension(pkgName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: extensionKeys.installed() });
    },
  });
}

// ─── Merged list (installed + available from all repos) ───────────────────────

export function useMergedExtensions(repos: ExtensionRepo[]): {
  data: ExtensionInfo[];
  isLoading: boolean;
  isError: boolean;
} {
  const installedQuery = useInstalledExtensions();

  // Parallel fetch of ALL repo indexes (enabled + disabled)
  // Disabled repos are needed to show full info for installed extensions from those repos
  const indexQueries = useQueries({
    queries: repos.map((repo) => ({
      queryKey: extensionKeys.index(repo.url),
      queryFn: () => fetchRepoIndex(repo.url),
      staleTime: 5 * 60 * 1000,
      meta: { repoUrl: repo.url, enabled: repo.enabled },
    })),
  });

  const isLoading =
    installedQuery.isLoading || indexQueries.some((q) => q.isLoading);
  const isError =
    installedQuery.isError || indexQueries.some((q) => q.isError);

  if (isLoading || isError) {
    return { data: [], isLoading, isError };
  }

  // Build pkgName → installed extension map
  const installedMap = new Map(
    (installedQuery.data ?? []).map((ext) => [ext.pkgName, ext]),
  );

  // Merge all repo entries, deduplicating by pkgName (first repo wins)
  const seen = new Set<string>();
  const merged: ExtensionInfo[] = [];

  indexQueries.forEach((q, i) => {
    const repo = repos[i];
    const repoUrl = repo?.url ?? '';
    const repoEnabled = repo?.enabled ?? false;

    for (const entry of q.data ?? []) {
      // Skip if already seen, or if from disabled repo and not installed
      if (seen.has(entry.pkg)) continue;
      const isInstalled = installedMap.has(entry.pkg);
      if (!repoEnabled && !isInstalled) continue;

      seen.add(entry.pkg);

      const installedExt = installedMap.get(entry.pkg);
      // Strip /index.min.json from repoUrl for APK URL construction
      const baseRepoUrl = repoUrl.replace(/\/index\.min\.json$/, '');
      merged.push({
        pkgName: entry.pkg,
        name: entry.name,
        versionName: entry.version,
        versionCode: entry.code,
        lang: entry.lang,
        isNsfw: entry.nsfw === 1,
        sources: entry.sources.map((s) => ({
          id: s.id,
          name: s.name,
          lang: s.lang,
          supportsLatest: false,
          isNsfw: false,
          versionId: 0,
        })),
        installed: !!installedExt,
        hasUpdate: installedExt ? entry.code > installedExt.versionCode : false,
        repoUrl,
        apkUrl: `${baseRepoUrl}/apk/${entry.apk}`,
        iconUrl: `${baseRepoUrl}/icon/${entry.pkg}.png`,
      });
    }
  });

  return { data: merged, isLoading: false, isError: false };
}
