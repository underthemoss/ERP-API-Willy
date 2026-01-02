import {
  LineItemPlaceKind,
  type LineItemPlaceRefInput,
} from './generated/graphql';

const PLACE_REF_KINDS = new Set<LineItemPlaceKind>([
  LineItemPlaceKind.Jobsite,
  LineItemPlaceKind.Branch,
  LineItemPlaceKind.Yard,
  LineItemPlaceKind.Address,
  LineItemPlaceKind.Geofence,
  LineItemPlaceKind.Other,
]);

export type PlaceRefInput = LineItemPlaceRefInput;

export const normalizePlaceRefInput = (
  placeRef?: PlaceRefInput | string | null,
): PlaceRefInput | undefined => {
  if (placeRef === null || placeRef === undefined) return undefined;
  if (typeof placeRef === 'string') {
    const trimmed = placeRef.trim();
    return trimmed ? { kind: LineItemPlaceKind.Other, id: trimmed } : undefined;
  }
  const id = placeRef.id?.trim();
  if (!id) return undefined;
  const kind = PLACE_REF_KINDS.has(placeRef.kind)
    ? placeRef.kind
    : LineItemPlaceKind.Other;
  return { kind, id };
};
