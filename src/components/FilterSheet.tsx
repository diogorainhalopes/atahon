import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Square, CheckSquare, XSquare, ArrowUp, ArrowDown } from 'phosphor-react-native';
import { colors } from '@theme/colors';
import { typography, fontFamily } from '@theme/typography';
import { radius, spacing } from '@theme/spacing';
import type { Filter } from '@/types/extensions';

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: Filter[];
  isLoading?: boolean;
  onApply: (filters: Filter[]) => void;
}

// Deep-clone filters to avoid mutating originals
function cloneFilters(filters: Filter[]): Filter[] {
  return filters.map((f) => {
    if (f.type === 'group' && Array.isArray(f.state)) {
      return { ...f, state: (f.state as Filter[]).map((c) => ({ ...c })) };
    }
    return { ...f };
  });
}

// ─── Individual filter renderers ─────────────────────────────────────────────

function HeaderFilter({ filter }: { filter: Filter }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{filter.name}</Text>
    </View>
  );
}

function SeparatorFilter() {
  return <View style={styles.separator} />;
}

function TextFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.filterRow}>
      <Text style={styles.filterLabel}>{filter.name}</Text>
      <TextInput
        style={styles.textInput}
        value={typeof filter.state === 'string' ? filter.state : ''}
        onChangeText={onChange}
        placeholder={filter.name}
        placeholderTextColor={colors.text.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function CheckBoxFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: boolean) => void;
}) {
  const checked = !!filter.state;
  return (
    <TouchableOpacity
      style={styles.filterRow}
      onPress={() => onChange(!checked)}
      activeOpacity={0.7}
    >
      <Text style={styles.filterLabel}>{filter.name}</Text>
      {checked ? (
        <CheckSquare size={20} color={colors.accent.DEFAULT} />
      ) : (
        <Square size={20} color={colors.text.muted} />
      )}
    </TouchableOpacity>
  );
}

function TriStateFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: number) => void;
}) {
  const state = typeof filter.state === 'number' ? filter.state : 0;
  // 0 = ignore, 1 = include, 2 = exclude
  function cycle() {
    onChange((state + 1) % 3);
  }
  return (
    <TouchableOpacity style={styles.filterRow} onPress={cycle} activeOpacity={0.7}>
      <Text style={styles.filterLabel}>{filter.name}</Text>
      {state === 0 && <Square size={20} color={colors.text.muted} />}
      {state === 1 && <CheckSquare size={20} color={colors.accent.DEFAULT} />}
      {state === 2 && <XSquare size={20} color={colors.status.error} />}
    </TouchableOpacity>
  );
}

interface SelectFilterData extends Filter {
  values?: string[];
}

function SelectFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: number) => void;
}) {
  const filterData = filter as SelectFilterData;
  const values = Array.isArray(filterData.values) ? filterData.values : [];
  const selectedIndex = typeof filter.state === 'number' ? filter.state : 0;
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.selectContainer}>
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>{filter.name}</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setOpen((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={styles.selectButtonText} numberOfLines={1}>
            {values[selectedIndex] ?? '—'}
          </Text>
        </TouchableOpacity>
      </View>
      {open && (
        <View style={styles.selectOptions}>
          {values.map((v, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.selectOption, i === selectedIndex && styles.selectOptionActive]}
              onPress={() => {
                onChange(i);
                setOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  i === selectedIndex && styles.selectOptionTextActive,
                ]}
              >
                {v}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

interface SortFilterData extends Filter {
  values?: string[];
}

function SortFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: { index: number; ascending: boolean } | null) => void;
}) {
  const filterData = filter as SortFilterData;
  const values = Array.isArray(filterData.values) ? filterData.values : [];
  const state =
    filter.state && typeof filter.state === 'object' && 'index' in (filter.state as object)
      ? (filter.state as { index: number; ascending: boolean })
      : null;

  function handlePress(i: number) {
    if (state?.index === i) {
      // Toggle direction
      onChange({ index: i, ascending: !state.ascending });
    } else {
      onChange({ index: i, ascending: true });
    }
  }

  return (
    <View style={styles.sortContainer}>
      <Text style={styles.sectionHeaderText}>{filter.name}</Text>
      {values.map((v, i) => {
        const isActive = state?.index === i;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.filterRow, isActive && styles.filterRowActive]}
            onPress={() => handlePress(i)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>{v}</Text>
            {isActive ? (
              state?.ascending ? (
                <ArrowUp size={18} color={colors.accent.DEFAULT} />
              ) : (
                <ArrowDown size={18} color={colors.accent.DEFAULT} />
              )
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function GroupFilter({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (value: Filter[]) => void;
}) {
  const children: Filter[] = Array.isArray(filter.state) ? (filter.state as Filter[]) : [];

  function handleChildChange(index: number, newState: unknown) {
    const updated = children.map((c, i) => (i === index ? { ...c, state: newState } : c));
    onChange(updated);
  }

  return (
    <View style={styles.groupContainer}>
      <Text style={styles.sectionHeaderText}>{filter.name}</Text>
      {children.map((child, i) => (
        <View key={i} style={styles.groupChild}>
          {child.type === 'checkbox' && (
            <CheckBoxFilter
              filter={child}
              onChange={(v) => handleChildChange(i, v)}
            />
          )}
          {child.type === 'tristate' && (
            <TriStateFilter
              filter={child}
              onChange={(v) => handleChildChange(i, v)}
            />
          )}
          {child.type === 'text' && (
            <TextFilter
              filter={child}
              onChange={(v) => handleChildChange(i, v)}
            />
          )}
          {child.type !== 'checkbox' && child.type !== 'tristate' && child.type !== 'text' && (
            <Text style={styles.filterLabel}>{child.name}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

// ─── Main FilterSheet ─────────────────────────────────────────────────────────

export default function FilterSheet({ visible, onClose, filters, isLoading, onApply }: FilterSheetProps) {
  const [localFilters, setLocalFilters] = useState<Filter[]>(() => cloneFilters(filters));

  // Sync whenever filters prop changes (covers the first-load case where the sheet
  // opens before useSourceFilters has resolved and filters arrives as [])
  useEffect(() => {
    if (filters.length > 0) {
      setLocalFilters(cloneFilters(filters));
    }
  }, [filters]);

  function handleFilterChange(index: number, newState: unknown) {
    setLocalFilters((prev) =>
      prev.map((f, i) => (i === index ? { ...f, state: newState } : f)),
    );
  }

  function handleReset() {
    setLocalFilters(cloneFilters(filters));
    onApply(filters);
  }

  function handleApply() {
    onApply(localFilters);
    onClose();
  }

  return (
    <>
      {visible && <Pressable style={styles.backdropFixed} onPress={onClose} />}
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.sheetContainer} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Filters</Text>

            {(isLoading || localFilters.length === 0) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent.DEFAULT} />
                <Text style={styles.loadingText}>Loading filters…</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
              {localFilters.map((filter, index) => {
                switch (filter.type) {
                  case 'header':
                    return <HeaderFilter key={index} filter={filter} />;
                  case 'separator':
                    return <SeparatorFilter key={index} />;
                  case 'text':
                    return (
                      <TextFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  case 'checkbox':
                    return (
                      <CheckBoxFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  case 'tristate':
                    return (
                      <TriStateFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  case 'select':
                    return (
                      <SelectFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  case 'group':
                    return (
                      <GroupFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  case 'sort':
                    return (
                      <SortFilter
                        key={index}
                        filter={filter}
                        onChange={(v) => handleFilterChange(index, v)}
                      />
                    );
                  default:
                    return null;
                }
              })}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.7}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdropFixed: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background.elevated,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[8],
    maxHeight: '80%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.DEFAULT,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  sheetTitle: {
    fontSize: typography.sizes.h2,
    fontFamily: fontFamily.semibold,
    color: colors.text.primary,
    letterSpacing: -0.2,
    marginBottom: spacing[4],
  },
  scrollView: {
    flexGrow: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[8],
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
    color: colors.text.muted,
  },
  sectionHeader: {
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  sectionHeaderText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginVertical: spacing[2],
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  filterRowActive: {
    backgroundColor: colors.accent.muted,
    borderRadius: radius.md,
    paddingHorizontal: spacing[2],
    borderBottomWidth: 0,
    marginBottom: 1,
  },
  filterLabel: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
    paddingRight: spacing[2],
  },
  filterLabelActive: {
    color: colors.accent.DEFAULT,
    fontFamily: fontFamily.medium,
  },
  textInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.regular,
    color: colors.text.primary,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    textAlign: 'right',
  },
  selectContainer: {
    marginBottom: spacing[1],
  },
  selectButton: {
    maxWidth: 150,
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.surface.DEFAULT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  selectButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: fontFamily.regular,
    color: colors.text.primary,
    textAlign: 'right',
  },
  selectOptions: {
    backgroundColor: colors.surface.elevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
    marginTop: spacing[1],
    marginBottom: spacing[2],
    overflow: 'hidden',
  },
  selectOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },
  selectOptionActive: {
    backgroundColor: colors.accent.muted,
  },
  selectOptionText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
  },
  selectOptionTextActive: {
    color: colors.accent.DEFAULT,
    fontFamily: fontFamily.medium,
  },
  sortContainer: {
    marginBottom: spacing[2],
  },
  groupContainer: {
    marginBottom: spacing[2],
  },
  groupChild: {
    paddingLeft: spacing[4],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  resetButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.surface.DEFAULT,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.DEFAULT,
  },
  resetButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.accent.DEFAULT,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: typography.sizes.base,
    fontFamily: fontFamily.semibold,
    color: '#fff',
  },
});
