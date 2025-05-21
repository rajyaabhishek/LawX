import { atom } from "recoil";

export const casesAtom = atom({
  key: "casesAtom",
  default: [],
});

export const selectedCaseAtom = atom({
  key: "selectedCaseAtom",
  default: null,
}); 