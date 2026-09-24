/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Implements the fontawesome module icon provider integration.
 */

import { ICON_NAMES, type IconName } from "../icon-names.js";
import { assertIconDefinition, type IconSvgDefinition } from "../icon-definition.js";
import type { IconLoader, IconProviderModule } from "../icon-provider.js";

interface FontAwesomeDefinition {
  readonly icon: readonly [
    number,
    number,
    readonly (number | string)[],
    string,
    string | readonly string[],
  ];
}

/**
 * Converts Font Awesome's raw SVG tuple into the neutral definition.
 *
 * @param value - Font Awesome icon definition.
 * @returns A validated neutral SVG definition.
 */
export function fromFontAwesomeDefinition(value: unknown): IconSvgDefinition {
  if (
    !value ||
    typeof value !== "object" ||
    !("icon" in value) ||
    !Array.isArray((value as FontAwesomeDefinition).icon)
  ) {
    throw new TypeError("[miaixz] Invalid Font Awesome icon definition.");
  }
  const [width, height, , , svgPathData] = (value as FontAwesomeDefinition).icon;
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    (typeof svgPathData !== "string" && !Array.isArray(svgPathData))
  ) {
    throw new TypeError("[miaixz] Invalid Font Awesome SVG data.");
  }
  const paths = typeof svgPathData === "string" ? [svgPathData] : svgPathData;
  return assertIconDefinition({
    kind: "svg",
    viewBox: `0 0 ${width} ${height}`,
    paint: "fill",
    nodes: paths.map((d) => ({ tag: "path", attributes: { d } })),
  }) as IconSvgDefinition;
}

/**
 * Audited Font Awesome Free mappings keyed only by Miaixz IconName.
 */
export const fontAwesomeIconMapping = {
  [ICON_NAMES.ADD]: async () => {
    const { faPlus } = await import("@fortawesome/free-solid-svg-icons/faPlus");
    return { default: fromFontAwesomeDefinition(faPlus) };
  },
  [ICON_NAMES.ALARM_CLOCK]: async () => {
    const { faAlarmClock } = await import("@fortawesome/free-solid-svg-icons/faAlarmClock");
    return { default: fromFontAwesomeDefinition(faAlarmClock) };
  },
  [ICON_NAMES.ANCHOR]: async () => {
    const { faAnchor } = await import("@fortawesome/free-solid-svg-icons/faAnchor");
    return { default: fromFontAwesomeDefinition(faAnchor) };
  },
  [ICON_NAMES.ARROW_DOWN]: async () => {
    const { faArrowDown } = await import("@fortawesome/free-solid-svg-icons/faArrowDown");
    return { default: fromFontAwesomeDefinition(faArrowDown) };
  },
  [ICON_NAMES.ARROW_DOWN_A_Z]: async () => {
    const { faArrowDownAZ } = await import("@fortawesome/free-solid-svg-icons/faArrowDownAZ");
    return { default: fromFontAwesomeDefinition(faArrowDownAZ) };
  },
  [ICON_NAMES.ARROW_DOWN_Z_A]: async () => {
    const { faArrowDownZA } = await import("@fortawesome/free-solid-svg-icons/faArrowDownZA");
    return { default: fromFontAwesomeDefinition(faArrowDownZA) };
  },
  [ICON_NAMES.ARROW_LEFT]: async () => {
    const { faArrowLeft } = await import("@fortawesome/free-solid-svg-icons/faArrowLeft");
    return { default: fromFontAwesomeDefinition(faArrowLeft) };
  },
  [ICON_NAMES.ARROW_RIGHT]: async () => {
    const { faArrowRight } = await import("@fortawesome/free-solid-svg-icons/faArrowRight");
    return { default: fromFontAwesomeDefinition(faArrowRight) };
  },
  [ICON_NAMES.ARROW_UP]: async () => {
    const { faArrowUp } = await import("@fortawesome/free-solid-svg-icons/faArrowUp");
    return { default: fromFontAwesomeDefinition(faArrowUp) };
  },
  [ICON_NAMES.ARROW_UP_A_Z]: async () => {
    const { faArrowUpAZ } = await import("@fortawesome/free-solid-svg-icons/faArrowUpAZ");
    return { default: fromFontAwesomeDefinition(faArrowUpAZ) };
  },
  [ICON_NAMES.ARROW_UP_Z_A]: async () => {
    const { faArrowUpZA } = await import("@fortawesome/free-solid-svg-icons/faArrowUpZA");
    return { default: fromFontAwesomeDefinition(faArrowUpZA) };
  },
  [ICON_NAMES.ASTERISK]: async () => {
    const { faAsterisk } = await import("@fortawesome/free-solid-svg-icons/faAsterisk");
    return { default: fromFontAwesomeDefinition(faAsterisk) };
  },
  [ICON_NAMES.ATOM]: async () => {
    const { faAtom } = await import("@fortawesome/free-solid-svg-icons/faAtom");
    return { default: fromFontAwesomeDefinition(faAtom) };
  },
  [ICON_NAMES.AWARD]: async () => {
    const { faAward } = await import("@fortawesome/free-solid-svg-icons/faAward");
    return { default: fromFontAwesomeDefinition(faAward) };
  },
  [ICON_NAMES.BABY]: async () => {
    const { faBaby } = await import("@fortawesome/free-solid-svg-icons/faBaby");
    return { default: fromFontAwesomeDefinition(faBaby) };
  },
  [ICON_NAMES.BAN]: async () => {
    const { faBan } = await import("@fortawesome/free-solid-svg-icons/faBan");
    return { default: fromFontAwesomeDefinition(faBan) };
  },
  [ICON_NAMES.BANDAGE]: async () => {
    const { faBandage } = await import("@fortawesome/free-solid-svg-icons/faBandage");
    return { default: fromFontAwesomeDefinition(faBandage) };
  },
  [ICON_NAMES.BARCODE]: async () => {
    const { faBarcode } = await import("@fortawesome/free-solid-svg-icons/faBarcode");
    return { default: fromFontAwesomeDefinition(faBarcode) };
  },
  [ICON_NAMES.BATH]: async () => {
    const { faBath } = await import("@fortawesome/free-solid-svg-icons/faBath");
    return { default: fromFontAwesomeDefinition(faBath) };
  },
  [ICON_NAMES.BATTERY_FULL]: async () => {
    const { faBatteryFull } = await import("@fortawesome/free-solid-svg-icons/faBatteryFull");
    return { default: fromFontAwesomeDefinition(faBatteryFull) };
  },
  [ICON_NAMES.BED]: async () => {
    const { faBed } = await import("@fortawesome/free-solid-svg-icons/faBed");
    return { default: fromFontAwesomeDefinition(faBed) };
  },
  [ICON_NAMES.BELL]: async () => {
    const { faBell } = await import("@fortawesome/free-solid-svg-icons/faBell");
    return { default: fromFontAwesomeDefinition(faBell) };
  },
  [ICON_NAMES.BINOCULARS]: async () => {
    const { faBinoculars } = await import("@fortawesome/free-solid-svg-icons/faBinoculars");
    return { default: fromFontAwesomeDefinition(faBinoculars) };
  },
  [ICON_NAMES.BIOHAZARD]: async () => {
    const { faBiohazard } = await import("@fortawesome/free-solid-svg-icons/faBiohazard");
    return { default: fromFontAwesomeDefinition(faBiohazard) };
  },
  [ICON_NAMES.BLENDER]: async () => {
    const { faBlender } = await import("@fortawesome/free-solid-svg-icons/faBlender");
    return { default: fromFontAwesomeDefinition(faBlender) };
  },
  [ICON_NAMES.BOLD]: async () => {
    const { faBold } = await import("@fortawesome/free-solid-svg-icons/faBold");
    return { default: fromFontAwesomeDefinition(faBold) };
  },
  [ICON_NAMES.BOLT]: async () => {
    const { faZap } = await import("@fortawesome/free-solid-svg-icons/faZap");
    return { default: fromFontAwesomeDefinition(faZap) };
  },
  [ICON_NAMES.BOMB]: async () => {
    const { faBomb } = await import("@fortawesome/free-solid-svg-icons/faBomb");
    return { default: fromFontAwesomeDefinition(faBomb) };
  },
  [ICON_NAMES.BONE]: async () => {
    const { faBone } = await import("@fortawesome/free-solid-svg-icons/faBone");
    return { default: fromFontAwesomeDefinition(faBone) };
  },
  [ICON_NAMES.BOOK]: async () => {
    const { faBook } = await import("@fortawesome/free-solid-svg-icons/faBook");
    return { default: fromFontAwesomeDefinition(faBook) };
  },
  [ICON_NAMES.BOOK_OPEN]: async () => {
    const { faBookOpen } = await import("@fortawesome/free-solid-svg-icons/faBookOpen");
    return { default: fromFontAwesomeDefinition(faBookOpen) };
  },
  [ICON_NAMES.BOOKMARK]: async () => {
    const { faBookmark } = await import("@fortawesome/free-solid-svg-icons/faBookmark");
    return { default: fromFontAwesomeDefinition(faBookmark) };
  },
  [ICON_NAMES.BOX]: async () => {
    const { faBox } = await import("@fortawesome/free-solid-svg-icons/faBox");
    return { default: fromFontAwesomeDefinition(faBox) };
  },
  [ICON_NAMES.BRAIN]: async () => {
    const { faBrain } = await import("@fortawesome/free-solid-svg-icons/faBrain");
    return { default: fromFontAwesomeDefinition(faBrain) };
  },
  [ICON_NAMES.BRIEFCASE]: async () => {
    const { faBriefcase } = await import("@fortawesome/free-solid-svg-icons/faBriefcase");
    return { default: fromFontAwesomeDefinition(faBriefcase) };
  },
  [ICON_NAMES.BRIEFCASE_MEDICAL]: async () => {
    const { faBriefcaseMedical } =
      await import("@fortawesome/free-solid-svg-icons/faBriefcaseMedical");
    return { default: fromFontAwesomeDefinition(faBriefcaseMedical) };
  },
  [ICON_NAMES.BROOM]: async () => {
    const { faBroom } = await import("@fortawesome/free-solid-svg-icons/faBroom");
    return { default: fromFontAwesomeDefinition(faBroom) };
  },
  [ICON_NAMES.BRUSH]: async () => {
    const { faBrush } = await import("@fortawesome/free-solid-svg-icons/faBrush");
    return { default: fromFontAwesomeDefinition(faBrush) };
  },
  [ICON_NAMES.BUG]: async () => {
    const { faBug } = await import("@fortawesome/free-solid-svg-icons/faBug");
    return { default: fromFontAwesomeDefinition(faBug) };
  },
  [ICON_NAMES.BUILDING]: async () => {
    const { faBuilding } = await import("@fortawesome/free-solid-svg-icons/faBuilding");
    return { default: fromFontAwesomeDefinition(faBuilding) };
  },
  [ICON_NAMES.BUS]: async () => {
    const { faBus } = await import("@fortawesome/free-solid-svg-icons/faBus");
    return { default: fromFontAwesomeDefinition(faBus) };
  },
  [ICON_NAMES.CABLE_CAR]: async () => {
    const { faTram } = await import("@fortawesome/free-solid-svg-icons/faTram");
    return { default: fromFontAwesomeDefinition(faTram) };
  },
  [ICON_NAMES.CALCULATOR]: async () => {
    const { faCalculator } = await import("@fortawesome/free-solid-svg-icons/faCalculator");
    return { default: fromFontAwesomeDefinition(faCalculator) };
  },
  [ICON_NAMES.CALENDAR]: async () => {
    const { faCalendar } = await import("@fortawesome/free-solid-svg-icons/faCalendar");
    return { default: fromFontAwesomeDefinition(faCalendar) };
  },
  [ICON_NAMES.CALENDAR_CHECK]: async () => {
    const { faCalendarCheck } = await import("@fortawesome/free-solid-svg-icons/faCalendarCheck");
    return { default: fromFontAwesomeDefinition(faCalendarCheck) };
  },
  [ICON_NAMES.CALENDAR_DAYS]: async () => {
    const { faCalendarDays } = await import("@fortawesome/free-solid-svg-icons/faCalendarDays");
    return { default: fromFontAwesomeDefinition(faCalendarDays) };
  },
  [ICON_NAMES.CALENDAR_MINUS]: async () => {
    const { faCalendarMinus } = await import("@fortawesome/free-solid-svg-icons/faCalendarMinus");
    return { default: fromFontAwesomeDefinition(faCalendarMinus) };
  },
  [ICON_NAMES.CALENDAR_PLUS]: async () => {
    const { faCalendarPlus } = await import("@fortawesome/free-solid-svg-icons/faCalendarPlus");
    return { default: fromFontAwesomeDefinition(faCalendarPlus) };
  },
  [ICON_NAMES.CAMERA]: async () => {
    const { faCamera } = await import("@fortawesome/free-solid-svg-icons/faCamera");
    return { default: fromFontAwesomeDefinition(faCamera) };
  },
  [ICON_NAMES.CANDY_CANE]: async () => {
    const { faCandyCane } = await import("@fortawesome/free-solid-svg-icons/faCandyCane");
    return { default: fromFontAwesomeDefinition(faCandyCane) };
  },
  [ICON_NAMES.CANNABIS]: async () => {
    const { faCannabis } = await import("@fortawesome/free-solid-svg-icons/faCannabis");
    return { default: fromFontAwesomeDefinition(faCannabis) };
  },
  [ICON_NAMES.CAR]: async () => {
    const { faCar } = await import("@fortawesome/free-solid-svg-icons/faCar");
    return { default: fromFontAwesomeDefinition(faCar) };
  },
  [ICON_NAMES.CAR_BATTERY]: async () => {
    const { faCarBattery } = await import("@fortawesome/free-solid-svg-icons/faCarBattery");
    return { default: fromFontAwesomeDefinition(faCarBattery) };
  },
  [ICON_NAMES.CARAVAN]: async () => {
    const { faCaravan } = await import("@fortawesome/free-solid-svg-icons/faCaravan");
    return { default: fromFontAwesomeDefinition(faCaravan) };
  },
  [ICON_NAMES.CARROT]: async () => {
    const { faCarrot } = await import("@fortawesome/free-solid-svg-icons/faCarrot");
    return { default: fromFontAwesomeDefinition(faCarrot) };
  },
  [ICON_NAMES.CAT]: async () => {
    const { faCat } = await import("@fortawesome/free-solid-svg-icons/faCat");
    return { default: fromFontAwesomeDefinition(faCat) };
  },
  [ICON_NAMES.CHART_AREA]: async () => {
    const { faChartArea } = await import("@fortawesome/free-solid-svg-icons/faChartArea");
    return { default: fromFontAwesomeDefinition(faChartArea) };
  },
  [ICON_NAMES.CHART_BAR]: async () => {
    const { faChartBar } = await import("@fortawesome/free-solid-svg-icons/faChartBar");
    return { default: fromFontAwesomeDefinition(faChartBar) };
  },
  [ICON_NAMES.CHART_COLUMN]: async () => {
    const { faChartColumn } = await import("@fortawesome/free-solid-svg-icons/faChartColumn");
    return { default: fromFontAwesomeDefinition(faChartColumn) };
  },
  [ICON_NAMES.CHART_GANTT]: async () => {
    const { faChartGantt } = await import("@fortawesome/free-solid-svg-icons/faChartGantt");
    return { default: fromFontAwesomeDefinition(faChartGantt) };
  },
  [ICON_NAMES.CHART_LINE]: async () => {
    const { faChartLine } = await import("@fortawesome/free-solid-svg-icons/faChartLine");
    return { default: fromFontAwesomeDefinition(faChartLine) };
  },
  [ICON_NAMES.CHART_PIE]: async () => {
    const { faChartPie } = await import("@fortawesome/free-solid-svg-icons/faChartPie");
    return { default: fromFontAwesomeDefinition(faChartPie) };
  },
  [ICON_NAMES.CHESS_BISHOP]: async () => {
    const { faChessBishop } = await import("@fortawesome/free-solid-svg-icons/faChessBishop");
    return { default: fromFontAwesomeDefinition(faChessBishop) };
  },
  [ICON_NAMES.CHESS_KING]: async () => {
    const { faChessKing } = await import("@fortawesome/free-solid-svg-icons/faChessKing");
    return { default: fromFontAwesomeDefinition(faChessKing) };
  },
  [ICON_NAMES.CHESS_KNIGHT]: async () => {
    const { faChessKnight } = await import("@fortawesome/free-solid-svg-icons/faChessKnight");
    return { default: fromFontAwesomeDefinition(faChessKnight) };
  },
  [ICON_NAMES.CHESS_PAWN]: async () => {
    const { faChessPawn } = await import("@fortawesome/free-solid-svg-icons/faChessPawn");
    return { default: fromFontAwesomeDefinition(faChessPawn) };
  },
  [ICON_NAMES.CHESS_QUEEN]: async () => {
    const { faChessQueen } = await import("@fortawesome/free-solid-svg-icons/faChessQueen");
    return { default: fromFontAwesomeDefinition(faChessQueen) };
  },
  [ICON_NAMES.CHESS_ROOK]: async () => {
    const { faChessRook } = await import("@fortawesome/free-solid-svg-icons/faChessRook");
    return { default: fromFontAwesomeDefinition(faChessRook) };
  },
  [ICON_NAMES.CHEVRON_DOWN]: async () => {
    const { faChevronDown } = await import("@fortawesome/free-solid-svg-icons/faChevronDown");
    return { default: fromFontAwesomeDefinition(faChevronDown) };
  },
  [ICON_NAMES.CHEVRON_LEFT]: async () => {
    const { faChevronLeft } = await import("@fortawesome/free-solid-svg-icons/faChevronLeft");
    return { default: fromFontAwesomeDefinition(faChevronLeft) };
  },
  [ICON_NAMES.CHEVRON_RIGHT]: async () => {
    const { faChevronRight } = await import("@fortawesome/free-solid-svg-icons/faChevronRight");
    return { default: fromFontAwesomeDefinition(faChevronRight) };
  },
  [ICON_NAMES.CHEVRON_UP]: async () => {
    const { faChevronUp } = await import("@fortawesome/free-solid-svg-icons/faChevronUp");
    return { default: fromFontAwesomeDefinition(faChevronUp) };
  },
  [ICON_NAMES.CHURCH]: async () => {
    const { faChurch } = await import("@fortawesome/free-solid-svg-icons/faChurch");
    return { default: fromFontAwesomeDefinition(faChurch) };
  },
  [ICON_NAMES.CIRCLE]: async () => {
    const { faCircle } = await import("@fortawesome/free-solid-svg-icons/faCircle");
    return { default: fromFontAwesomeDefinition(faCircle) };
  },
  [ICON_NAMES.CIRCLE_ARROW_DOWN]: async () => {
    const { faCircleArrowDown } =
      await import("@fortawesome/free-solid-svg-icons/faCircleArrowDown");
    return { default: fromFontAwesomeDefinition(faCircleArrowDown) };
  },
  [ICON_NAMES.CIRCLE_ARROW_LEFT]: async () => {
    const { faCircleArrowLeft } =
      await import("@fortawesome/free-solid-svg-icons/faCircleArrowLeft");
    return { default: fromFontAwesomeDefinition(faCircleArrowLeft) };
  },
  [ICON_NAMES.CIRCLE_ARROW_RIGHT]: async () => {
    const { faCircleArrowRight } =
      await import("@fortawesome/free-solid-svg-icons/faCircleArrowRight");
    return { default: fromFontAwesomeDefinition(faCircleArrowRight) };
  },
  [ICON_NAMES.CIRCLE_ARROW_UP]: async () => {
    const { faCircleArrowUp } = await import("@fortawesome/free-solid-svg-icons/faCircleArrowUp");
    return { default: fromFontAwesomeDefinition(faCircleArrowUp) };
  },
  [ICON_NAMES.CIRCLE_CHECK]: async () => {
    const { faCircleCheck } = await import("@fortawesome/free-solid-svg-icons/faCircleCheck");
    return { default: fromFontAwesomeDefinition(faCircleCheck) };
  },
  [ICON_NAMES.CIRCLE_CHEVRON_DOWN]: async () => {
    const { faCircleChevronDown } =
      await import("@fortawesome/free-solid-svg-icons/faCircleChevronDown");
    return { default: fromFontAwesomeDefinition(faCircleChevronDown) };
  },
  [ICON_NAMES.CIRCLE_CHEVRON_LEFT]: async () => {
    const { faCircleChevronLeft } =
      await import("@fortawesome/free-solid-svg-icons/faCircleChevronLeft");
    return { default: fromFontAwesomeDefinition(faCircleChevronLeft) };
  },
  [ICON_NAMES.CIRCLE_CHEVRON_RIGHT]: async () => {
    const { faCircleChevronRight } =
      await import("@fortawesome/free-solid-svg-icons/faCircleChevronRight");
    return { default: fromFontAwesomeDefinition(faCircleChevronRight) };
  },
  [ICON_NAMES.CIRCLE_CHEVRON_UP]: async () => {
    const { faCircleChevronUp } =
      await import("@fortawesome/free-solid-svg-icons/faCircleChevronUp");
    return { default: fromFontAwesomeDefinition(faCircleChevronUp) };
  },
  [ICON_NAMES.CIRCLE_DOT]: async () => {
    const { faCircleDot } = await import("@fortawesome/free-solid-svg-icons/faCircleDot");
    return { default: fromFontAwesomeDefinition(faCircleDot) };
  },
  [ICON_NAMES.CIRCLE_MINUS]: async () => {
    const { faCircleMinus } = await import("@fortawesome/free-solid-svg-icons/faCircleMinus");
    return { default: fromFontAwesomeDefinition(faCircleMinus) };
  },
  [ICON_NAMES.CIRCLE_PAUSE]: async () => {
    const { faCirclePause } = await import("@fortawesome/free-solid-svg-icons/faCirclePause");
    return { default: fromFontAwesomeDefinition(faCirclePause) };
  },
  [ICON_NAMES.CIRCLE_PLAY]: async () => {
    const { faCirclePlay } = await import("@fortawesome/free-solid-svg-icons/faCirclePlay");
    return { default: fromFontAwesomeDefinition(faCirclePlay) };
  },
  [ICON_NAMES.CIRCLE_PLUS]: async () => {
    const { faCirclePlus } = await import("@fortawesome/free-solid-svg-icons/faCirclePlus");
    return { default: fromFontAwesomeDefinition(faCirclePlus) };
  },
  [ICON_NAMES.CIRCLE_STOP]: async () => {
    const { faCircleStop } = await import("@fortawesome/free-solid-svg-icons/faCircleStop");
    return { default: fromFontAwesomeDefinition(faCircleStop) };
  },
  [ICON_NAMES.CIRCLE_USER]: async () => {
    const { faCircleUser } = await import("@fortawesome/free-solid-svg-icons/faCircleUser");
    return { default: fromFontAwesomeDefinition(faCircleUser) };
  },
  [ICON_NAMES.CLAPPERBOARD]: async () => {
    const { faClapperboard } = await import("@fortawesome/free-solid-svg-icons/faClapperboard");
    return { default: fromFontAwesomeDefinition(faClapperboard) };
  },
  [ICON_NAMES.CLIPBOARD]: async () => {
    const { faClipboard } = await import("@fortawesome/free-solid-svg-icons/faClipboard");
    return { default: fromFontAwesomeDefinition(faClipboard) };
  },
  [ICON_NAMES.CLIPBOARD_CHECK]: async () => {
    const { faClipboardCheck } = await import("@fortawesome/free-solid-svg-icons/faClipboardCheck");
    return { default: fromFontAwesomeDefinition(faClipboardCheck) };
  },
  [ICON_NAMES.CLIPBOARD_LIST]: async () => {
    const { faClipboardList } = await import("@fortawesome/free-solid-svg-icons/faClipboardList");
    return { default: fromFontAwesomeDefinition(faClipboardList) };
  },
  [ICON_NAMES.CLOCK]: async () => {
    const { faClock } = await import("@fortawesome/free-solid-svg-icons/faClock");
    return { default: fromFontAwesomeDefinition(faClock) };
  },
  [ICON_NAMES.CLOSE]: async () => {
    const { faXmark } = await import("@fortawesome/free-solid-svg-icons/faXmark");
    return { default: fromFontAwesomeDefinition(faXmark) };
  },
  [ICON_NAMES.CLOUD]: async () => {
    const { faCloud } = await import("@fortawesome/free-solid-svg-icons/faCloud");
    return { default: fromFontAwesomeDefinition(faCloud) };
  },
  [ICON_NAMES.CLOUD_MOON]: async () => {
    const { faCloudMoon } = await import("@fortawesome/free-solid-svg-icons/faCloudMoon");
    return { default: fromFontAwesomeDefinition(faCloudMoon) };
  },
  [ICON_NAMES.CLOUD_MOON_RAIN]: async () => {
    const { faCloudMoonRain } = await import("@fortawesome/free-solid-svg-icons/faCloudMoonRain");
    return { default: fromFontAwesomeDefinition(faCloudMoonRain) };
  },
  [ICON_NAMES.CLOUD_RAIN]: async () => {
    const { faCloudRain } = await import("@fortawesome/free-solid-svg-icons/faCloudRain");
    return { default: fromFontAwesomeDefinition(faCloudRain) };
  },
  [ICON_NAMES.CLOUD_SUN]: async () => {
    const { faCloudSun } = await import("@fortawesome/free-solid-svg-icons/faCloudSun");
    return { default: fromFontAwesomeDefinition(faCloudSun) };
  },
  [ICON_NAMES.CLOUD_SUN_RAIN]: async () => {
    const { faCloudSunRain } = await import("@fortawesome/free-solid-svg-icons/faCloudSunRain");
    return { default: fromFontAwesomeDefinition(faCloudSunRain) };
  },
  [ICON_NAMES.CLOVER]: async () => {
    const { faClover } = await import("@fortawesome/free-solid-svg-icons/faClover");
    return { default: fromFontAwesomeDefinition(faClover) };
  },
  [ICON_NAMES.CODE]: async () => {
    const { faCode } = await import("@fortawesome/free-solid-svg-icons/faCode");
    return { default: fromFontAwesomeDefinition(faCode) };
  },
  [ICON_NAMES.COINS]: async () => {
    const { faCoins } = await import("@fortawesome/free-solid-svg-icons/faCoins");
    return { default: fromFontAwesomeDefinition(faCoins) };
  },
  [ICON_NAMES.COMPASS]: async () => {
    const { faCompass } = await import("@fortawesome/free-solid-svg-icons/faCompass");
    return { default: fromFontAwesomeDefinition(faCompass) };
  },
  [ICON_NAMES.COMPUTER]: async () => {
    const { faComputer } = await import("@fortawesome/free-solid-svg-icons/faComputer");
    return { default: fromFontAwesomeDefinition(faComputer) };
  },
  [ICON_NAMES.CONFIRM]: async () => {
    const { faCheck } = await import("@fortawesome/free-solid-svg-icons/faCheck");
    return { default: fromFontAwesomeDefinition(faCheck) };
  },
  [ICON_NAMES.COOKIE]: async () => {
    const { faCookie } = await import("@fortawesome/free-solid-svg-icons/faCookie");
    return { default: fromFontAwesomeDefinition(faCookie) };
  },
  [ICON_NAMES.COPY]: async () => {
    const { faCopy } = await import("@fortawesome/free-solid-svg-icons/faCopy");
    return { default: fromFontAwesomeDefinition(faCopy) };
  },
  [ICON_NAMES.COPYRIGHT]: async () => {
    const { faCopyright } = await import("@fortawesome/free-solid-svg-icons/faCopyright");
    return { default: fromFontAwesomeDefinition(faCopyright) };
  },
  [ICON_NAMES.CREDIT_CARD]: async () => {
    const { faCreditCard } = await import("@fortawesome/free-solid-svg-icons/faCreditCard");
    return { default: fromFontAwesomeDefinition(faCreditCard) };
  },
  [ICON_NAMES.CROP]: async () => {
    const { faCrop } = await import("@fortawesome/free-solid-svg-icons/faCrop");
    return { default: fromFontAwesomeDefinition(faCrop) };
  },
  [ICON_NAMES.CROSS]: async () => {
    const { faCross } = await import("@fortawesome/free-solid-svg-icons/faCross");
    return { default: fromFontAwesomeDefinition(faCross) };
  },
  [ICON_NAMES.CROWN]: async () => {
    const { faCrown } = await import("@fortawesome/free-solid-svg-icons/faCrown");
    return { default: fromFontAwesomeDefinition(faCrown) };
  },
  [ICON_NAMES.DATABASE]: async () => {
    const { faDatabase } = await import("@fortawesome/free-solid-svg-icons/faDatabase");
    return { default: fromFontAwesomeDefinition(faDatabase) };
  },
  [ICON_NAMES.DELETE]: async () => {
    const { faTrashCan } = await import("@fortawesome/free-solid-svg-icons/faTrashCan");
    return { default: fromFontAwesomeDefinition(faTrashCan) };
  },
  [ICON_NAMES.DIAMOND]: async () => {
    const { faDiamond } = await import("@fortawesome/free-solid-svg-icons/faDiamond");
    return { default: fromFontAwesomeDefinition(faDiamond) };
  },
  [ICON_NAMES.DIVIDE]: async () => {
    const { faDivide } = await import("@fortawesome/free-solid-svg-icons/faDivide");
    return { default: fromFontAwesomeDefinition(faDivide) };
  },
  [ICON_NAMES.DNA]: async () => {
    const { faDna } = await import("@fortawesome/free-solid-svg-icons/faDna");
    return { default: fromFontAwesomeDefinition(faDna) };
  },
  [ICON_NAMES.DOG]: async () => {
    const { faDog } = await import("@fortawesome/free-solid-svg-icons/faDog");
    return { default: fromFontAwesomeDefinition(faDog) };
  },
  [ICON_NAMES.DOLLAR_SIGN]: async () => {
    const { faUsd } = await import("@fortawesome/free-solid-svg-icons/faUsd");
    return { default: fromFontAwesomeDefinition(faUsd) };
  },
  [ICON_NAMES.DOOR_CLOSED]: async () => {
    const { faDoorClosed } = await import("@fortawesome/free-solid-svg-icons/faDoorClosed");
    return { default: fromFontAwesomeDefinition(faDoorClosed) };
  },
  [ICON_NAMES.DOOR_OPEN]: async () => {
    const { faDoorOpen } = await import("@fortawesome/free-solid-svg-icons/faDoorOpen");
    return { default: fromFontAwesomeDefinition(faDoorOpen) };
  },
  [ICON_NAMES.DOWNLOAD]: async () => {
    const { faDownload } = await import("@fortawesome/free-solid-svg-icons/faDownload");
    return { default: fromFontAwesomeDefinition(faDownload) };
  },
  [ICON_NAMES.DROPLET]: async () => {
    const { faTint } = await import("@fortawesome/free-solid-svg-icons/faTint");
    return { default: fromFontAwesomeDefinition(faTint) };
  },
  [ICON_NAMES.DRUM]: async () => {
    const { faDrum } = await import("@fortawesome/free-solid-svg-icons/faDrum");
    return { default: fromFontAwesomeDefinition(faDrum) };
  },
  [ICON_NAMES.DUMBBELL]: async () => {
    const { faDumbbell } = await import("@fortawesome/free-solid-svg-icons/faDumbbell");
    return { default: fromFontAwesomeDefinition(faDumbbell) };
  },
  [ICON_NAMES.EDIT]: async () => {
    const { faPenToSquare } = await import("@fortawesome/free-solid-svg-icons/faPenToSquare");
    return { default: fromFontAwesomeDefinition(faPenToSquare) };
  },
  [ICON_NAMES.EGG]: async () => {
    const { faEgg } = await import("@fortawesome/free-solid-svg-icons/faEgg");
    return { default: fromFontAwesomeDefinition(faEgg) };
  },
  [ICON_NAMES.EJECT]: async () => {
    const { faEject } = await import("@fortawesome/free-solid-svg-icons/faEject");
    return { default: fromFontAwesomeDefinition(faEject) };
  },
  [ICON_NAMES.ERASER]: async () => {
    const { faEraser } = await import("@fortawesome/free-solid-svg-icons/faEraser");
    return { default: fromFontAwesomeDefinition(faEraser) };
  },
  [ICON_NAMES.EXPAND]: async () => {
    const { faExpand } = await import("@fortawesome/free-solid-svg-icons/faExpand");
    return { default: fromFontAwesomeDefinition(faExpand) };
  },
  [ICON_NAMES.EYE]: async () => {
    const { faEye } = await import("@fortawesome/free-solid-svg-icons/faEye");
    return { default: fromFontAwesomeDefinition(faEye) };
  },
  [ICON_NAMES.FACE_ANGRY]: async () => {
    const { faFaceAngry } = await import("@fortawesome/free-solid-svg-icons/faFaceAngry");
    return { default: fromFontAwesomeDefinition(faFaceAngry) };
  },
  [ICON_NAMES.FAN]: async () => {
    const { faFan } = await import("@fortawesome/free-solid-svg-icons/faFan");
    return { default: fromFontAwesomeDefinition(faFan) };
  },
  [ICON_NAMES.FEATHER]: async () => {
    const { faFeather } = await import("@fortawesome/free-solid-svg-icons/faFeather");
    return { default: fromFontAwesomeDefinition(faFeather) };
  },
  [ICON_NAMES.FILE]: async () => {
    const { faFile } = await import("@fortawesome/free-solid-svg-icons/faFile");
    return { default: fromFontAwesomeDefinition(faFile) };
  },
  [ICON_NAMES.FILE_CODE]: async () => {
    const { faFileCode } = await import("@fortawesome/free-solid-svg-icons/faFileCode");
    return { default: fromFontAwesomeDefinition(faFileCode) };
  },
  [ICON_NAMES.FILE_IMAGE]: async () => {
    const { faFileImage } = await import("@fortawesome/free-solid-svg-icons/faFileImage");
    return { default: fromFontAwesomeDefinition(faFileImage) };
  },
  [ICON_NAMES.FILE_PEN]: async () => {
    const { faFilePen } = await import("@fortawesome/free-solid-svg-icons/faFilePen");
    return { default: fromFontAwesomeDefinition(faFilePen) };
  },
  [ICON_NAMES.FILM]: async () => {
    const { faFilm } = await import("@fortawesome/free-solid-svg-icons/faFilm");
    return { default: fromFontAwesomeDefinition(faFilm) };
  },
  [ICON_NAMES.FIRE_EXTINGUISHER]: async () => {
    const { faFireExtinguisher } =
      await import("@fortawesome/free-solid-svg-icons/faFireExtinguisher");
    return { default: fromFontAwesomeDefinition(faFireExtinguisher) };
  },
  [ICON_NAMES.FISH]: async () => {
    const { faFish } = await import("@fortawesome/free-solid-svg-icons/faFish");
    return { default: fromFontAwesomeDefinition(faFish) };
  },
  [ICON_NAMES.FLAG]: async () => {
    const { faFlag } = await import("@fortawesome/free-solid-svg-icons/faFlag");
    return { default: fromFontAwesomeDefinition(faFlag) };
  },
  [ICON_NAMES.FOLDER]: async () => {
    const { faFolder } = await import("@fortawesome/free-solid-svg-icons/faFolder");
    return { default: fromFontAwesomeDefinition(faFolder) };
  },
  [ICON_NAMES.FOLDER_CLOSED]: async () => {
    const { faFolderClosed } = await import("@fortawesome/free-solid-svg-icons/faFolderClosed");
    return { default: fromFontAwesomeDefinition(faFolderClosed) };
  },
  [ICON_NAMES.FOLDER_MINUS]: async () => {
    const { faFolderMinus } = await import("@fortawesome/free-solid-svg-icons/faFolderMinus");
    return { default: fromFontAwesomeDefinition(faFolderMinus) };
  },
  [ICON_NAMES.FOLDER_OPEN]: async () => {
    const { faFolderOpen } = await import("@fortawesome/free-solid-svg-icons/faFolderOpen");
    return { default: fromFontAwesomeDefinition(faFolderOpen) };
  },
  [ICON_NAMES.FOLDER_PLUS]: async () => {
    const { faFolderPlus } = await import("@fortawesome/free-solid-svg-icons/faFolderPlus");
    return { default: fromFontAwesomeDefinition(faFolderPlus) };
  },
  [ICON_NAMES.FOLDER_TREE]: async () => {
    const { faFolderTree } = await import("@fortawesome/free-solid-svg-icons/faFolderTree");
    return { default: fromFontAwesomeDefinition(faFolderTree) };
  },
  [ICON_NAMES.FORWARD]: async () => {
    const { faForward } = await import("@fortawesome/free-solid-svg-icons/faForward");
    return { default: fromFontAwesomeDefinition(faForward) };
  },
  [ICON_NAMES.GAMEPAD]: async () => {
    const { faGamepad } = await import("@fortawesome/free-solid-svg-icons/faGamepad");
    return { default: fromFontAwesomeDefinition(faGamepad) };
  },
  [ICON_NAMES.GAUGE]: async () => {
    const { faGauge } = await import("@fortawesome/free-solid-svg-icons/faGauge");
    return { default: fromFontAwesomeDefinition(faGauge) };
  },
  [ICON_NAMES.GAVEL]: async () => {
    const { faGavel } = await import("@fortawesome/free-solid-svg-icons/faGavel");
    return { default: fromFontAwesomeDefinition(faGavel) };
  },
  [ICON_NAMES.GEM]: async () => {
    const { faGem } = await import("@fortawesome/free-solid-svg-icons/faGem");
    return { default: fromFontAwesomeDefinition(faGem) };
  },
  [ICON_NAMES.GHOST]: async () => {
    const { faGhost } = await import("@fortawesome/free-solid-svg-icons/faGhost");
    return { default: fromFontAwesomeDefinition(faGhost) };
  },
  [ICON_NAMES.GIFT]: async () => {
    const { faGift } = await import("@fortawesome/free-solid-svg-icons/faGift");
    return { default: fromFontAwesomeDefinition(faGift) };
  },
  [ICON_NAMES.GLASS_WATER]: async () => {
    const { faGlassWater } = await import("@fortawesome/free-solid-svg-icons/faGlassWater");
    return { default: fromFontAwesomeDefinition(faGlassWater) };
  },
  [ICON_NAMES.GLASSES]: async () => {
    const { faGlasses } = await import("@fortawesome/free-solid-svg-icons/faGlasses");
    return { default: fromFontAwesomeDefinition(faGlasses) };
  },
  [ICON_NAMES.GLOBE]: async () => {
    const { faGlobe } = await import("@fortawesome/free-solid-svg-icons/faGlobe");
    return { default: fromFontAwesomeDefinition(faGlobe) };
  },
  [ICON_NAMES.GRADUATION_CAP]: async () => {
    const { faMortarBoard } = await import("@fortawesome/free-solid-svg-icons/faMortarBoard");
    return { default: fromFontAwesomeDefinition(faMortarBoard) };
  },
  [ICON_NAMES.GRIP]: async () => {
    const { faGrip } = await import("@fortawesome/free-solid-svg-icons/faGrip");
    return { default: fromFontAwesomeDefinition(faGrip) };
  },
  [ICON_NAMES.GRIP_VERTICAL]: async () => {
    const { faGripVertical } = await import("@fortawesome/free-solid-svg-icons/faGripVertical");
    return { default: fromFontAwesomeDefinition(faGripVertical) };
  },
  [ICON_NAMES.GUITAR]: async () => {
    const { faGuitar } = await import("@fortawesome/free-solid-svg-icons/faGuitar");
    return { default: fromFontAwesomeDefinition(faGuitar) };
  },
  [ICON_NAMES.HAMMER]: async () => {
    const { faHammer } = await import("@fortawesome/free-solid-svg-icons/faHammer");
    return { default: fromFontAwesomeDefinition(faHammer) };
  },
  [ICON_NAMES.HAND]: async () => {
    const { faHand } = await import("@fortawesome/free-solid-svg-icons/faHand");
    return { default: fromFontAwesomeDefinition(faHand) };
  },
  [ICON_NAMES.HAND_FIST]: async () => {
    const { faHandFist } = await import("@fortawesome/free-solid-svg-icons/faHandFist");
    return { default: fromFontAwesomeDefinition(faHandFist) };
  },
  [ICON_NAMES.HANDSHAKE]: async () => {
    const { faHandshake } = await import("@fortawesome/free-solid-svg-icons/faHandshake");
    return { default: fromFontAwesomeDefinition(faHandshake) };
  },
  [ICON_NAMES.HARD_DRIVE]: async () => {
    const { faHdd } = await import("@fortawesome/free-solid-svg-icons/faHdd");
    return { default: fromFontAwesomeDefinition(faHdd) };
  },
  [ICON_NAMES.HEADING]: async () => {
    const { faHeading } = await import("@fortawesome/free-solid-svg-icons/faHeading");
    return { default: fromFontAwesomeDefinition(faHeading) };
  },
  [ICON_NAMES.HEADPHONES]: async () => {
    const { faHeadphones } = await import("@fortawesome/free-solid-svg-icons/faHeadphones");
    return { default: fromFontAwesomeDefinition(faHeadphones) };
  },
  [ICON_NAMES.HEADSET]: async () => {
    const { faHeadset } = await import("@fortawesome/free-solid-svg-icons/faHeadset");
    return { default: fromFontAwesomeDefinition(faHeadset) };
  },
  [ICON_NAMES.HEART]: async () => {
    const { faHeart } = await import("@fortawesome/free-solid-svg-icons/faHeart");
    return { default: fromFontAwesomeDefinition(faHeart) };
  },
  [ICON_NAMES.HEART_CRACK]: async () => {
    const { faHeartCrack } = await import("@fortawesome/free-solid-svg-icons/faHeartCrack");
    return { default: fromFontAwesomeDefinition(faHeartCrack) };
  },
  [ICON_NAMES.HEART_PULSE]: async () => {
    const { faHeartbeat } = await import("@fortawesome/free-solid-svg-icons/faHeartbeat");
    return { default: fromFontAwesomeDefinition(faHeartbeat) };
  },
  [ICON_NAMES.HELICOPTER]: async () => {
    const { faHelicopter } = await import("@fortawesome/free-solid-svg-icons/faHelicopter");
    return { default: fromFontAwesomeDefinition(faHelicopter) };
  },
  [ICON_NAMES.HELP]: async () => {
    const { faCircleQuestion } = await import("@fortawesome/free-solid-svg-icons/faCircleQuestion");
    return { default: fromFontAwesomeDefinition(faCircleQuestion) };
  },
  [ICON_NAMES.HEXAGON]: async () => {
    const { faHexagon } = await import("@fortawesome/free-solid-svg-icons/faHexagon");
    return { default: fromFontAwesomeDefinition(faHexagon) };
  },
  [ICON_NAMES.HIGHLIGHTER]: async () => {
    const { faHighlighter } = await import("@fortawesome/free-solid-svg-icons/faHighlighter");
    return { default: fromFontAwesomeDefinition(faHighlighter) };
  },
  [ICON_NAMES.HOSPITAL]: async () => {
    const { faHospital } = await import("@fortawesome/free-solid-svg-icons/faHospital");
    return { default: fromFontAwesomeDefinition(faHospital) };
  },
  [ICON_NAMES.HOTEL]: async () => {
    const { faHotel } = await import("@fortawesome/free-solid-svg-icons/faHotel");
    return { default: fromFontAwesomeDefinition(faHotel) };
  },
  [ICON_NAMES.HOURGLASS]: async () => {
    const { faHourglass } = await import("@fortawesome/free-solid-svg-icons/faHourglass");
    return { default: fromFontAwesomeDefinition(faHourglass) };
  },
  [ICON_NAMES.HOUSE]: async () => {
    const { faHouse } = await import("@fortawesome/free-solid-svg-icons/faHouse");
    return { default: fromFontAwesomeDefinition(faHouse) };
  },
  [ICON_NAMES.ID_CARD]: async () => {
    const { faIdCard } = await import("@fortawesome/free-solid-svg-icons/faIdCard");
    return { default: fromFontAwesomeDefinition(faIdCard) };
  },
  [ICON_NAMES.IMAGE]: async () => {
    const { faImage } = await import("@fortawesome/free-solid-svg-icons/faImage");
    return { default: fromFontAwesomeDefinition(faImage) };
  },
  [ICON_NAMES.IMAGES]: async () => {
    const { faImages } = await import("@fortawesome/free-solid-svg-icons/faImages");
    return { default: fromFontAwesomeDefinition(faImages) };
  },
  [ICON_NAMES.INBOX]: async () => {
    const { faInbox } = await import("@fortawesome/free-solid-svg-icons/faInbox");
    return { default: fromFontAwesomeDefinition(faInbox) };
  },
  [ICON_NAMES.INFINITY]: async () => {
    const { faInfinity } = await import("@fortawesome/free-solid-svg-icons/faInfinity");
    return { default: fromFontAwesomeDefinition(faInfinity) };
  },
  [ICON_NAMES.INFO]: async () => {
    const { faInfo } = await import("@fortawesome/free-solid-svg-icons/faInfo");
    return { default: fromFontAwesomeDefinition(faInfo) };
  },
  [ICON_NAMES.ITALIC]: async () => {
    const { faItalic } = await import("@fortawesome/free-solid-svg-icons/faItalic");
    return { default: fromFontAwesomeDefinition(faItalic) };
  },
  [ICON_NAMES.KEY]: async () => {
    const { faKey } = await import("@fortawesome/free-solid-svg-icons/faKey");
    return { default: fromFontAwesomeDefinition(faKey) };
  },
  [ICON_NAMES.KEYBOARD]: async () => {
    const { faKeyboard } = await import("@fortawesome/free-solid-svg-icons/faKeyboard");
    return { default: fromFontAwesomeDefinition(faKeyboard) };
  },
  [ICON_NAMES.LANDMARK]: async () => {
    const { faLandmark } = await import("@fortawesome/free-solid-svg-icons/faLandmark");
    return { default: fromFontAwesomeDefinition(faLandmark) };
  },
  [ICON_NAMES.LAPTOP]: async () => {
    const { faLaptop } = await import("@fortawesome/free-solid-svg-icons/faLaptop");
    return { default: fromFontAwesomeDefinition(faLaptop) };
  },
  [ICON_NAMES.LEAF]: async () => {
    const { faLeaf } = await import("@fortawesome/free-solid-svg-icons/faLeaf");
    return { default: fromFontAwesomeDefinition(faLeaf) };
  },
  [ICON_NAMES.LIGHTBULB]: async () => {
    const { faLightbulb } = await import("@fortawesome/free-solid-svg-icons/faLightbulb");
    return { default: fromFontAwesomeDefinition(faLightbulb) };
  },
  [ICON_NAMES.LINK]: async () => {
    const { faLink } = await import("@fortawesome/free-solid-svg-icons/faLink");
    return { default: fromFontAwesomeDefinition(faLink) };
  },
  [ICON_NAMES.LIST]: async () => {
    const { faList } = await import("@fortawesome/free-solid-svg-icons/faList");
    return { default: fromFontAwesomeDefinition(faList) };
  },
  [ICON_NAMES.LIST_CHECK]: async () => {
    const { faTasks } = await import("@fortawesome/free-solid-svg-icons/faTasks");
    return { default: fromFontAwesomeDefinition(faTasks) };
  },
  [ICON_NAMES.LOADING]: async () => {
    const { faSpinner } = await import("@fortawesome/free-solid-svg-icons/faSpinner");
    return { default: fromFontAwesomeDefinition(faSpinner) };
  },
  [ICON_NAMES.LOCK]: async () => {
    const { faLock } = await import("@fortawesome/free-solid-svg-icons/faLock");
    return { default: fromFontAwesomeDefinition(faLock) };
  },
  [ICON_NAMES.LOCK_OPEN]: async () => {
    const { faLockOpen } = await import("@fortawesome/free-solid-svg-icons/faLockOpen");
    return { default: fromFontAwesomeDefinition(faLockOpen) };
  },
  [ICON_NAMES.MAGNET]: async () => {
    const { faMagnet } = await import("@fortawesome/free-solid-svg-icons/faMagnet");
    return { default: fromFontAwesomeDefinition(faMagnet) };
  },
  [ICON_NAMES.MAP]: async () => {
    const { faMap } = await import("@fortawesome/free-solid-svg-icons/faMap");
    return { default: fromFontAwesomeDefinition(faMap) };
  },
  [ICON_NAMES.MAP_PIN]: async () => {
    const { faMapPin } = await import("@fortawesome/free-solid-svg-icons/faMapPin");
    return { default: fromFontAwesomeDefinition(faMapPin) };
  },
  [ICON_NAMES.MARS]: async () => {
    const { faMars } = await import("@fortawesome/free-solid-svg-icons/faMars");
    return { default: fromFontAwesomeDefinition(faMars) };
  },
  [ICON_NAMES.MARS_STROKE]: async () => {
    const { faMarsStroke } = await import("@fortawesome/free-solid-svg-icons/faMarsStroke");
    return { default: fromFontAwesomeDefinition(faMarsStroke) };
  },
  [ICON_NAMES.MAXIMIZE]: async () => {
    const { faMaximize } = await import("@fortawesome/free-solid-svg-icons/faMaximize");
    return { default: fromFontAwesomeDefinition(faMaximize) };
  },
  [ICON_NAMES.MEDAL]: async () => {
    const { faMedal } = await import("@fortawesome/free-solid-svg-icons/faMedal");
    return { default: fromFontAwesomeDefinition(faMedal) };
  },
  [ICON_NAMES.MICROCHIP]: async () => {
    const { faMicrochip } = await import("@fortawesome/free-solid-svg-icons/faMicrochip");
    return { default: fromFontAwesomeDefinition(faMicrochip) };
  },
  [ICON_NAMES.MICROSCOPE]: async () => {
    const { faMicroscope } = await import("@fortawesome/free-solid-svg-icons/faMicroscope");
    return { default: fromFontAwesomeDefinition(faMicroscope) };
  },
  [ICON_NAMES.MINIMIZE]: async () => {
    const { faMinimize } = await import("@fortawesome/free-solid-svg-icons/faMinimize");
    return { default: fromFontAwesomeDefinition(faMinimize) };
  },
  [ICON_NAMES.MOON]: async () => {
    const { faMoon } = await import("@fortawesome/free-solid-svg-icons/faMoon");
    return { default: fromFontAwesomeDefinition(faMoon) };
  },
  [ICON_NAMES.MORE_HORIZONTAL]: async () => {
    const { faEllipsis } = await import("@fortawesome/free-solid-svg-icons/faEllipsis");
    return { default: fromFontAwesomeDefinition(faEllipsis) };
  },
  [ICON_NAMES.MORE_VERTICAL]: async () => {
    const { faEllipsisVertical } =
      await import("@fortawesome/free-solid-svg-icons/faEllipsisVertical");
    return { default: fromFontAwesomeDefinition(faEllipsisVertical) };
  },
  [ICON_NAMES.MOSQUE]: async () => {
    const { faMosque } = await import("@fortawesome/free-solid-svg-icons/faMosque");
    return { default: fromFontAwesomeDefinition(faMosque) };
  },
  [ICON_NAMES.MOUNTAIN]: async () => {
    const { faMountain } = await import("@fortawesome/free-solid-svg-icons/faMountain");
    return { default: fromFontAwesomeDefinition(faMountain) };
  },
  [ICON_NAMES.NEWSPAPER]: async () => {
    const { faNewspaper } = await import("@fortawesome/free-solid-svg-icons/faNewspaper");
    return { default: fromFontAwesomeDefinition(faNewspaper) };
  },
  [ICON_NAMES.NON_BINARY]: async () => {
    const { faNonBinary } = await import("@fortawesome/free-solid-svg-icons/faNonBinary");
    return { default: fromFontAwesomeDefinition(faNonBinary) };
  },
  [ICON_NAMES.OCTAGON]: async () => {
    const { faOctagon } = await import("@fortawesome/free-solid-svg-icons/faOctagon");
    return { default: fromFontAwesomeDefinition(faOctagon) };
  },
  [ICON_NAMES.PAINT_ROLLER]: async () => {
    const { faPaintRoller } = await import("@fortawesome/free-solid-svg-icons/faPaintRoller");
    return { default: fromFontAwesomeDefinition(faPaintRoller) };
  },
  [ICON_NAMES.PAINTBRUSH]: async () => {
    const { faPaintbrush } = await import("@fortawesome/free-solid-svg-icons/faPaintbrush");
    return { default: fromFontAwesomeDefinition(faPaintbrush) };
  },
  [ICON_NAMES.PALETTE]: async () => {
    const { faPalette } = await import("@fortawesome/free-solid-svg-icons/faPalette");
    return { default: fromFontAwesomeDefinition(faPalette) };
  },
  [ICON_NAMES.PAPERCLIP]: async () => {
    const { faPaperclip } = await import("@fortawesome/free-solid-svg-icons/faPaperclip");
    return { default: fromFontAwesomeDefinition(faPaperclip) };
  },
  [ICON_NAMES.PAUSE]: async () => {
    const { faPause } = await import("@fortawesome/free-solid-svg-icons/faPause");
    return { default: fromFontAwesomeDefinition(faPause) };
  },
  [ICON_NAMES.PEN]: async () => {
    const { faPen } = await import("@fortawesome/free-solid-svg-icons/faPen");
    return { default: fromFontAwesomeDefinition(faPen) };
  },
  [ICON_NAMES.PENCIL]: async () => {
    const { faPencil } = await import("@fortawesome/free-solid-svg-icons/faPencil");
    return { default: fromFontAwesomeDefinition(faPencil) };
  },
  [ICON_NAMES.PENTAGON]: async () => {
    const { faPentagon } = await import("@fortawesome/free-solid-svg-icons/faPentagon");
    return { default: fromFontAwesomeDefinition(faPentagon) };
  },
  [ICON_NAMES.PERCENT]: async () => {
    const { faPercent } = await import("@fortawesome/free-solid-svg-icons/faPercent");
    return { default: fromFontAwesomeDefinition(faPercent) };
  },
  [ICON_NAMES.PHONE]: async () => {
    const { faPhone } = await import("@fortawesome/free-solid-svg-icons/faPhone");
    return { default: fromFontAwesomeDefinition(faPhone) };
  },
  [ICON_NAMES.PIGGY_BANK]: async () => {
    const { faPiggyBank } = await import("@fortawesome/free-solid-svg-icons/faPiggyBank");
    return { default: fromFontAwesomeDefinition(faPiggyBank) };
  },
  [ICON_NAMES.PLANE]: async () => {
    const { faPlane } = await import("@fortawesome/free-solid-svg-icons/faPlane");
    return { default: fromFontAwesomeDefinition(faPlane) };
  },
  [ICON_NAMES.PLAY]: async () => {
    const { faPlay } = await import("@fortawesome/free-solid-svg-icons/faPlay");
    return { default: fromFontAwesomeDefinition(faPlay) };
  },
  [ICON_NAMES.PLUG]: async () => {
    const { faPlug } = await import("@fortawesome/free-solid-svg-icons/faPlug");
    return { default: fromFontAwesomeDefinition(faPlug) };
  },
  [ICON_NAMES.POWER_OFF]: async () => {
    const { faPowerOff } = await import("@fortawesome/free-solid-svg-icons/faPowerOff");
    return { default: fromFontAwesomeDefinition(faPowerOff) };
  },
  [ICON_NAMES.RADIATION]: async () => {
    const { faRadiation } = await import("@fortawesome/free-solid-svg-icons/faRadiation");
    return { default: fromFontAwesomeDefinition(faRadiation) };
  },
  [ICON_NAMES.RADIO]: async () => {
    const { faRadio } = await import("@fortawesome/free-solid-svg-icons/faRadio");
    return { default: fromFontAwesomeDefinition(faRadio) };
  },
  [ICON_NAMES.RAINBOW]: async () => {
    const { faRainbow } = await import("@fortawesome/free-solid-svg-icons/faRainbow");
    return { default: fromFontAwesomeDefinition(faRainbow) };
  },
  [ICON_NAMES.RECEIPT]: async () => {
    const { faReceipt } = await import("@fortawesome/free-solid-svg-icons/faReceipt");
    return { default: fromFontAwesomeDefinition(faReceipt) };
  },
  [ICON_NAMES.RECYCLE]: async () => {
    const { faRecycle } = await import("@fortawesome/free-solid-svg-icons/faRecycle");
    return { default: fromFontAwesomeDefinition(faRecycle) };
  },
  [ICON_NAMES.REMOVE]: async () => {
    const { faMinus } = await import("@fortawesome/free-solid-svg-icons/faMinus");
    return { default: fromFontAwesomeDefinition(faMinus) };
  },
  [ICON_NAMES.REPEAT]: async () => {
    const { faRepeat } = await import("@fortawesome/free-solid-svg-icons/faRepeat");
    return { default: fromFontAwesomeDefinition(faRepeat) };
  },
  [ICON_NAMES.REPLY]: async () => {
    const { faReply } = await import("@fortawesome/free-solid-svg-icons/faReply");
    return { default: fromFontAwesomeDefinition(faReply) };
  },
  [ICON_NAMES.REPLY_ALL]: async () => {
    const { faReplyAll } = await import("@fortawesome/free-solid-svg-icons/faReplyAll");
    return { default: fromFontAwesomeDefinition(faReplyAll) };
  },
  [ICON_NAMES.RIBBON]: async () => {
    const { faRibbon } = await import("@fortawesome/free-solid-svg-icons/faRibbon");
    return { default: fromFontAwesomeDefinition(faRibbon) };
  },
  [ICON_NAMES.ROAD]: async () => {
    const { faRoad } = await import("@fortawesome/free-solid-svg-icons/faRoad");
    return { default: fromFontAwesomeDefinition(faRoad) };
  },
  [ICON_NAMES.ROCKET]: async () => {
    const { faRocket } = await import("@fortawesome/free-solid-svg-icons/faRocket");
    return { default: fromFontAwesomeDefinition(faRocket) };
  },
  [ICON_NAMES.ROUTE]: async () => {
    const { faRoute } = await import("@fortawesome/free-solid-svg-icons/faRoute");
    return { default: fromFontAwesomeDefinition(faRoute) };
  },
  [ICON_NAMES.RSS]: async () => {
    const { faRss } = await import("@fortawesome/free-solid-svg-icons/faRss");
    return { default: fromFontAwesomeDefinition(faRss) };
  },
  [ICON_NAMES.RULER]: async () => {
    const { faRuler } = await import("@fortawesome/free-solid-svg-icons/faRuler");
    return { default: fromFontAwesomeDefinition(faRuler) };
  },
  [ICON_NAMES.SAILBOAT]: async () => {
    const { faSailboat } = await import("@fortawesome/free-solid-svg-icons/faSailboat");
    return { default: fromFontAwesomeDefinition(faSailboat) };
  },
  [ICON_NAMES.SATELLITE]: async () => {
    const { faSatellite } = await import("@fortawesome/free-solid-svg-icons/faSatellite");
    return { default: fromFontAwesomeDefinition(faSatellite) };
  },
  [ICON_NAMES.SATELLITE_DISH]: async () => {
    const { faSatelliteDish } = await import("@fortawesome/free-solid-svg-icons/faSatelliteDish");
    return { default: fromFontAwesomeDefinition(faSatelliteDish) };
  },
  [ICON_NAMES.SCHOOL]: async () => {
    const { faSchool } = await import("@fortawesome/free-solid-svg-icons/faSchool");
    return { default: fromFontAwesomeDefinition(faSchool) };
  },
  [ICON_NAMES.SCISSORS]: async () => {
    const { faScissors } = await import("@fortawesome/free-solid-svg-icons/faScissors");
    return { default: fromFontAwesomeDefinition(faScissors) };
  },
  [ICON_NAMES.SCROLL]: async () => {
    const { faScroll } = await import("@fortawesome/free-solid-svg-icons/faScroll");
    return { default: fromFontAwesomeDefinition(faScroll) };
  },
  [ICON_NAMES.SEARCH]: async () => {
    const { faMagnifyingGlass } =
      await import("@fortawesome/free-solid-svg-icons/faMagnifyingGlass");
    return { default: fromFontAwesomeDefinition(faMagnifyingGlass) };
  },
  [ICON_NAMES.SECTION]: async () => {
    const { faSection } = await import("@fortawesome/free-solid-svg-icons/faSection");
    return { default: fromFontAwesomeDefinition(faSection) };
  },
  [ICON_NAMES.SERVER]: async () => {
    const { faServer } = await import("@fortawesome/free-solid-svg-icons/faServer");
    return { default: fromFontAwesomeDefinition(faServer) };
  },
  [ICON_NAMES.SETTINGS]: async () => {
    const { faGear } = await import("@fortawesome/free-solid-svg-icons/faGear");
    return { default: fromFontAwesomeDefinition(faGear) };
  },
  [ICON_NAMES.SHAPES]: async () => {
    const { faShapes } = await import("@fortawesome/free-solid-svg-icons/faShapes");
    return { default: fromFontAwesomeDefinition(faShapes) };
  },
  [ICON_NAMES.SHARE_NODES]: async () => {
    const { faShareNodes } = await import("@fortawesome/free-solid-svg-icons/faShareNodes");
    return { default: fromFontAwesomeDefinition(faShareNodes) };
  },
  [ICON_NAMES.SHIELD]: async () => {
    const { faShield } = await import("@fortawesome/free-solid-svg-icons/faShield");
    return { default: fromFontAwesomeDefinition(faShield) };
  },
  [ICON_NAMES.SHIP]: async () => {
    const { faShip } = await import("@fortawesome/free-solid-svg-icons/faShip");
    return { default: fromFontAwesomeDefinition(faShip) };
  },
  [ICON_NAMES.SHIRT]: async () => {
    const { faShirt } = await import("@fortawesome/free-solid-svg-icons/faShirt");
    return { default: fromFontAwesomeDefinition(faShirt) };
  },
  [ICON_NAMES.SHRIMP]: async () => {
    const { faShrimp } = await import("@fortawesome/free-solid-svg-icons/faShrimp");
    return { default: fromFontAwesomeDefinition(faShrimp) };
  },
  [ICON_NAMES.SHUFFLE]: async () => {
    const { faShuffle } = await import("@fortawesome/free-solid-svg-icons/faShuffle");
    return { default: fromFontAwesomeDefinition(faShuffle) };
  },
  [ICON_NAMES.SIGNAL]: async () => {
    const { faSignal } = await import("@fortawesome/free-solid-svg-icons/faSignal");
    return { default: fromFontAwesomeDefinition(faSignal) };
  },
  [ICON_NAMES.SIGNATURE]: async () => {
    const { faSignature } = await import("@fortawesome/free-solid-svg-icons/faSignature");
    return { default: fromFontAwesomeDefinition(faSignature) };
  },
  [ICON_NAMES.SKULL]: async () => {
    const { faSkull } = await import("@fortawesome/free-solid-svg-icons/faSkull");
    return { default: fromFontAwesomeDefinition(faSkull) };
  },
  [ICON_NAMES.SLASH]: async () => {
    const { faSlash } = await import("@fortawesome/free-solid-svg-icons/faSlash");
    return { default: fromFontAwesomeDefinition(faSlash) };
  },
  [ICON_NAMES.SNOWFLAKE]: async () => {
    const { faSnowflake } = await import("@fortawesome/free-solid-svg-icons/faSnowflake");
    return { default: fromFontAwesomeDefinition(faSnowflake) };
  },
  [ICON_NAMES.SOLAR_PANEL]: async () => {
    const { faSolarPanel } = await import("@fortawesome/free-solid-svg-icons/faSolarPanel");
    return { default: fromFontAwesomeDefinition(faSolarPanel) };
  },
  [ICON_NAMES.SPRAY_CAN]: async () => {
    const { faSprayCan } = await import("@fortawesome/free-solid-svg-icons/faSprayCan");
    return { default: fromFontAwesomeDefinition(faSprayCan) };
  },
  [ICON_NAMES.SQUARE]: async () => {
    const { faSquare } = await import("@fortawesome/free-solid-svg-icons/faSquare");
    return { default: fromFontAwesomeDefinition(faSquare) };
  },
  [ICON_NAMES.SQUARE_ARROW_UP_RIGHT]: async () => {
    const { faSquareArrowUpRight } =
      await import("@fortawesome/free-solid-svg-icons/faSquareArrowUpRight");
    return { default: fromFontAwesomeDefinition(faSquareArrowUpRight) };
  },
  [ICON_NAMES.SQUARE_CHECK]: async () => {
    const { faSquareCheck } = await import("@fortawesome/free-solid-svg-icons/faSquareCheck");
    return { default: fromFontAwesomeDefinition(faSquareCheck) };
  },
  [ICON_NAMES.SQUARE_MINUS]: async () => {
    const { faSquareMinus } = await import("@fortawesome/free-solid-svg-icons/faSquareMinus");
    return { default: fromFontAwesomeDefinition(faSquareMinus) };
  },
  [ICON_NAMES.SQUARE_PARKING]: async () => {
    const { faSquareParking } = await import("@fortawesome/free-solid-svg-icons/faSquareParking");
    return { default: fromFontAwesomeDefinition(faSquareParking) };
  },
  [ICON_NAMES.SQUARE_PLUS]: async () => {
    const { faSquarePlus } = await import("@fortawesome/free-solid-svg-icons/faSquarePlus");
    return { default: fromFontAwesomeDefinition(faSquarePlus) };
  },
  [ICON_NAMES.STAMP]: async () => {
    const { faStamp } = await import("@fortawesome/free-solid-svg-icons/faStamp");
    return { default: fromFontAwesomeDefinition(faStamp) };
  },
  [ICON_NAMES.STAR]: async () => {
    const { faStar } = await import("@fortawesome/free-solid-svg-icons/faStar");
    return { default: fromFontAwesomeDefinition(faStar) };
  },
  [ICON_NAMES.STAR_HALF]: async () => {
    const { faStarHalf } = await import("@fortawesome/free-solid-svg-icons/faStarHalf");
    return { default: fromFontAwesomeDefinition(faStarHalf) };
  },
  [ICON_NAMES.STETHOSCOPE]: async () => {
    const { faStethoscope } = await import("@fortawesome/free-solid-svg-icons/faStethoscope");
    return { default: fromFontAwesomeDefinition(faStethoscope) };
  },
  [ICON_NAMES.STORE]: async () => {
    const { faStore } = await import("@fortawesome/free-solid-svg-icons/faStore");
    return { default: fromFontAwesomeDefinition(faStore) };
  },
  [ICON_NAMES.STRIKETHROUGH]: async () => {
    const { faStrikethrough } = await import("@fortawesome/free-solid-svg-icons/faStrikethrough");
    return { default: fromFontAwesomeDefinition(faStrikethrough) };
  },
  [ICON_NAMES.SUBSCRIPT]: async () => {
    const { faSubscript } = await import("@fortawesome/free-solid-svg-icons/faSubscript");
    return { default: fromFontAwesomeDefinition(faSubscript) };
  },
  [ICON_NAMES.SUN]: async () => {
    const { faSun } = await import("@fortawesome/free-solid-svg-icons/faSun");
    return { default: fromFontAwesomeDefinition(faSun) };
  },
  [ICON_NAMES.SUPERSCRIPT]: async () => {
    const { faSuperscript } = await import("@fortawesome/free-solid-svg-icons/faSuperscript");
    return { default: fromFontAwesomeDefinition(faSuperscript) };
  },
  [ICON_NAMES.SYRINGE]: async () => {
    const { faSyringe } = await import("@fortawesome/free-solid-svg-icons/faSyringe");
    return { default: fromFontAwesomeDefinition(faSyringe) };
  },
  [ICON_NAMES.TABLE]: async () => {
    const { faTable } = await import("@fortawesome/free-solid-svg-icons/faTable");
    return { default: fromFontAwesomeDefinition(faTable) };
  },
  [ICON_NAMES.TABLET]: async () => {
    const { faTablet } = await import("@fortawesome/free-solid-svg-icons/faTablet");
    return { default: fromFontAwesomeDefinition(faTablet) };
  },
  [ICON_NAMES.TABLETS]: async () => {
    const { faTablets } = await import("@fortawesome/free-solid-svg-icons/faTablets");
    return { default: fromFontAwesomeDefinition(faTablets) };
  },
  [ICON_NAMES.TAG]: async () => {
    const { faTag } = await import("@fortawesome/free-solid-svg-icons/faTag");
    return { default: fromFontAwesomeDefinition(faTag) };
  },
  [ICON_NAMES.TAGS]: async () => {
    const { faTags } = await import("@fortawesome/free-solid-svg-icons/faTags");
    return { default: fromFontAwesomeDefinition(faTags) };
  },
  [ICON_NAMES.TENT]: async () => {
    const { faTent } = await import("@fortawesome/free-solid-svg-icons/faTent");
    return { default: fromFontAwesomeDefinition(faTent) };
  },
  [ICON_NAMES.TERMINAL]: async () => {
    const { faTerminal } = await import("@fortawesome/free-solid-svg-icons/faTerminal");
    return { default: fromFontAwesomeDefinition(faTerminal) };
  },
  [ICON_NAMES.THERMOMETER]: async () => {
    const { faThermometer } = await import("@fortawesome/free-solid-svg-icons/faThermometer");
    return { default: fromFontAwesomeDefinition(faThermometer) };
  },
  [ICON_NAMES.THUMBS_DOWN]: async () => {
    const { faThumbsDown } = await import("@fortawesome/free-solid-svg-icons/faThumbsDown");
    return { default: fromFontAwesomeDefinition(faThumbsDown) };
  },
  [ICON_NAMES.THUMBS_UP]: async () => {
    const { faThumbsUp } = await import("@fortawesome/free-solid-svg-icons/faThumbsUp");
    return { default: fromFontAwesomeDefinition(faThumbsUp) };
  },
  [ICON_NAMES.TICKET]: async () => {
    const { faTicket } = await import("@fortawesome/free-solid-svg-icons/faTicket");
    return { default: fromFontAwesomeDefinition(faTicket) };
  },
  [ICON_NAMES.TIMELINE]: async () => {
    const { faTimeline } = await import("@fortawesome/free-solid-svg-icons/faTimeline");
    return { default: fromFontAwesomeDefinition(faTimeline) };
  },
  [ICON_NAMES.TOILET]: async () => {
    const { faToilet } = await import("@fortawesome/free-solid-svg-icons/faToilet");
    return { default: fromFontAwesomeDefinition(faToilet) };
  },
  [ICON_NAMES.TOOLBOX]: async () => {
    const { faToolbox } = await import("@fortawesome/free-solid-svg-icons/faToolbox");
    return { default: fromFontAwesomeDefinition(faToolbox) };
  },
  [ICON_NAMES.TORNADO]: async () => {
    const { faTornado } = await import("@fortawesome/free-solid-svg-icons/faTornado");
    return { default: fromFontAwesomeDefinition(faTornado) };
  },
  [ICON_NAMES.TRACTOR]: async () => {
    const { faTractor } = await import("@fortawesome/free-solid-svg-icons/faTractor");
    return { default: fromFontAwesomeDefinition(faTractor) };
  },
  [ICON_NAMES.TRAILER]: async () => {
    const { faTrailer } = await import("@fortawesome/free-solid-svg-icons/faTrailer");
    return { default: fromFontAwesomeDefinition(faTrailer) };
  },
  [ICON_NAMES.TRANSGENDER]: async () => {
    const { faTransgender } = await import("@fortawesome/free-solid-svg-icons/faTransgender");
    return { default: fromFontAwesomeDefinition(faTransgender) };
  },
  [ICON_NAMES.TROPHY]: async () => {
    const { faTrophy } = await import("@fortawesome/free-solid-svg-icons/faTrophy");
    return { default: fromFontAwesomeDefinition(faTrophy) };
  },
  [ICON_NAMES.TRUCK]: async () => {
    const { faTruck } = await import("@fortawesome/free-solid-svg-icons/faTruck");
    return { default: fromFontAwesomeDefinition(faTruck) };
  },
  [ICON_NAMES.TV]: async () => {
    const { faTv } = await import("@fortawesome/free-solid-svg-icons/faTv");
    return { default: fromFontAwesomeDefinition(faTv) };
  },
  [ICON_NAMES.UMBRELLA]: async () => {
    const { faUmbrella } = await import("@fortawesome/free-solid-svg-icons/faUmbrella");
    return { default: fromFontAwesomeDefinition(faUmbrella) };
  },
  [ICON_NAMES.UNDERLINE]: async () => {
    const { faUnderline } = await import("@fortawesome/free-solid-svg-icons/faUnderline");
    return { default: fromFontAwesomeDefinition(faUnderline) };
  },
  [ICON_NAMES.UPLOAD]: async () => {
    const { faUpload } = await import("@fortawesome/free-solid-svg-icons/faUpload");
    return { default: fromFontAwesomeDefinition(faUpload) };
  },
  [ICON_NAMES.USER]: async () => {
    const { faUser } = await import("@fortawesome/free-solid-svg-icons/faUser");
    return { default: fromFontAwesomeDefinition(faUser) };
  },
  [ICON_NAMES.USER_CHECK]: async () => {
    const { faUserCheck } = await import("@fortawesome/free-solid-svg-icons/faUserCheck");
    return { default: fromFontAwesomeDefinition(faUserCheck) };
  },
  [ICON_NAMES.USER_LOCK]: async () => {
    const { faUserLock } = await import("@fortawesome/free-solid-svg-icons/faUserLock");
    return { default: fromFontAwesomeDefinition(faUserLock) };
  },
  [ICON_NAMES.USER_MINUS]: async () => {
    const { faUserMinus } = await import("@fortawesome/free-solid-svg-icons/faUserMinus");
    return { default: fromFontAwesomeDefinition(faUserMinus) };
  },
  [ICON_NAMES.USER_PEN]: async () => {
    const { faUserPen } = await import("@fortawesome/free-solid-svg-icons/faUserPen");
    return { default: fromFontAwesomeDefinition(faUserPen) };
  },
  [ICON_NAMES.USER_PLUS]: async () => {
    const { faUserPlus } = await import("@fortawesome/free-solid-svg-icons/faUserPlus");
    return { default: fromFontAwesomeDefinition(faUserPlus) };
  },
  [ICON_NAMES.USER_SHIELD]: async () => {
    const { faUserShield } = await import("@fortawesome/free-solid-svg-icons/faUserShield");
    return { default: fromFontAwesomeDefinition(faUserShield) };
  },
  [ICON_NAMES.USERS]: async () => {
    const { faUsers } = await import("@fortawesome/free-solid-svg-icons/faUsers");
    return { default: fromFontAwesomeDefinition(faUsers) };
  },
  [ICON_NAMES.UTENSILS]: async () => {
    const { faUtensils } = await import("@fortawesome/free-solid-svg-icons/faUtensils");
    return { default: fromFontAwesomeDefinition(faUtensils) };
  },
  [ICON_NAMES.VAULT]: async () => {
    const { faVault } = await import("@fortawesome/free-solid-svg-icons/faVault");
    return { default: fromFontAwesomeDefinition(faVault) };
  },
  [ICON_NAMES.VENUS]: async () => {
    const { faVenus } = await import("@fortawesome/free-solid-svg-icons/faVenus");
    return { default: fromFontAwesomeDefinition(faVenus) };
  },
  [ICON_NAMES.VIDEO]: async () => {
    const { faVideo } = await import("@fortawesome/free-solid-svg-icons/faVideo");
    return { default: fromFontAwesomeDefinition(faVideo) };
  },
  [ICON_NAMES.VOICEMAIL]: async () => {
    const { faVoicemail } = await import("@fortawesome/free-solid-svg-icons/faVoicemail");
    return { default: fromFontAwesomeDefinition(faVoicemail) };
  },
  [ICON_NAMES.VOLLEYBALL]: async () => {
    const { faVolleyball } = await import("@fortawesome/free-solid-svg-icons/faVolleyball");
    return { default: fromFontAwesomeDefinition(faVolleyball) };
  },
  [ICON_NAMES.VOLUME_HIGH]: async () => {
    const { faVolumeUp } = await import("@fortawesome/free-solid-svg-icons/faVolumeUp");
    return { default: fromFontAwesomeDefinition(faVolumeUp) };
  },
  [ICON_NAMES.VOLUME_LOW]: async () => {
    const { faVolumeLow } = await import("@fortawesome/free-solid-svg-icons/faVolumeLow");
    return { default: fromFontAwesomeDefinition(faVolumeLow) };
  },
  [ICON_NAMES.VOLUME_OFF]: async () => {
    const { faVolumeOff } = await import("@fortawesome/free-solid-svg-icons/faVolumeOff");
    return { default: fromFontAwesomeDefinition(faVolumeOff) };
  },
  [ICON_NAMES.WALLET]: async () => {
    const { faWallet } = await import("@fortawesome/free-solid-svg-icons/faWallet");
    return { default: fromFontAwesomeDefinition(faWallet) };
  },
  [ICON_NAMES.WAND_SPARKLES]: async () => {
    const { faWandSparkles } = await import("@fortawesome/free-solid-svg-icons/faWandSparkles");
    return { default: fromFontAwesomeDefinition(faWandSparkles) };
  },
  [ICON_NAMES.WAREHOUSE]: async () => {
    const { faWarehouse } = await import("@fortawesome/free-solid-svg-icons/faWarehouse");
    return { default: fromFontAwesomeDefinition(faWarehouse) };
  },
  [ICON_NAMES.WARNING]: async () => {
    const { faTriangleExclamation } =
      await import("@fortawesome/free-solid-svg-icons/faTriangleExclamation");
    return { default: fromFontAwesomeDefinition(faTriangleExclamation) };
  },
  [ICON_NAMES.WIFI]: async () => {
    const { faWifi } = await import("@fortawesome/free-solid-svg-icons/faWifi");
    return { default: fromFontAwesomeDefinition(faWifi) };
  },
  [ICON_NAMES.WIND]: async () => {
    const { faWind } = await import("@fortawesome/free-solid-svg-icons/faWind");
    return { default: fromFontAwesomeDefinition(faWind) };
  },
  [ICON_NAMES.WORM]: async () => {
    const { faWorm } = await import("@fortawesome/free-solid-svg-icons/faWorm");
    return { default: fromFontAwesomeDefinition(faWorm) };
  },
  [ICON_NAMES.WRENCH]: async () => {
    const { faWrench } = await import("@fortawesome/free-solid-svg-icons/faWrench");
    return { default: fromFontAwesomeDefinition(faWrench) };
  },
} satisfies Readonly<Partial<Record<IconName, IconLoader>>>;

const fontAwesomeProviderModule: IconProviderModule = Object.freeze({
  id: "fontawesome-free",
  icons: fontAwesomeIconMapping,
});

export default fontAwesomeProviderModule;
