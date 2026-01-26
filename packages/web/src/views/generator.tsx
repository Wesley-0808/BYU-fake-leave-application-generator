import { computed, defineComponent, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import dayjs from "dayjs";
import {
  calculationTime,
  getTimeRange,
  getUserById,
  randomDurationWithHourChance,
} from "@byu-flag/utils";

import type { Template } from "@/types";

export default defineComponent({
  name: "GeneratorPage",
  setup() {
    const router = useRouter();
    const route = useRoute();
    const template = computed<Template>(() => {
      return JSON.parse(route.query.template?.toString() || "{}");
    });
    const requestId = computed(() => {
      const prefix = "QJ_";
      const date = dayjs(template.value.submitTime).format("YYYYMMDD");
      // 随机数
      const randomNum = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, "0");
      return `${prefix}${date}${randomNum}`;
    });
    const submitTime = computed(() => {
      return dayjs(template.value.submitTime).format("YYYY-MM-DD HH:mm");
    });
    const totalTime = computed(() => {
      return calculationTime(template.value.time[0], template.value.time[1])
        .label;
    });
    const showType = computed(() => {
      return (template.value.modelType || "PC").toLocaleLowerCase();
    });
    // 判断是否已超过当日 20:00
    const isAfterEightPM = () => {
      const now = dayjs();
      const eightPM = now.hour(20).minute(0).second(0);
      return now.isAfter(eightPM);
    };

    const nextAuditRandomSeconds = randomDurationWithHourChance(10, 0.4);
    const nextNextAuditRandomSeconds = randomDurationWithHourChance(30, 0.4);

    // nextAuditCommit ≥ 基准时间 + 10 分钟 + 随机增量
    const nextAuditCommit = computed(() => {
      const baseTime = dayjs(template.value.submitTime);
      if (!baseTime.isValid()) return null;

      return baseTime.add(nextAuditRandomSeconds, "second");
    });

    // nextNextAuditCommit ≥ nextAuditCommit + 30 分钟 + 随机增量
    // 如果当前时间超过 20:00 → 返回 null
    const nextNextAuditCommit = computed(() => {
      if (!nextAuditCommit.value) return null;
      if (isAfterEightPM()) return null;

      return dayjs(nextAuditCommit.value).add(
        nextNextAuditRandomSeconds,
        "second",
      );
    });

    // 更新网页标题
    watch(
      () => template,
      () => {
        document.title = `请假申请-${template.value.name || "?"}-${dayjs(template.value.submitTime || new Date()).format("YYYY-MM-DD")}`;
      },
      { immediate: true },
    );

    const goBack = () => {
      router.push({ path: "/" });
    };

    const HeaderButton = (props: {
      title: string;
      type?: "primary" | "default";
    }) => (
      <button
        class={`ui-btn ui-btn-${props.type || "default"} ui-btn-middle ui-btn-inline`}
        title={props.title}
        onClick={goBack}
      >
        {props.title}
      </button>
    );

    const LabelWidget = (props: {
      text: string;
      cellClass: string;
      dataId: string;
      id?: string;
    }) => (
      <td class={props.cellClass} rowspan="1" colspan="1">
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId}
          class=""
          data-style="weapp-form-widget"
        >
          <span class="weapp-form-widget-internal-title">
            <span class="">{props.text}</span>
          </span>
        </div>
      </td>
    );

    const BrowserWidget = (props: {
      value: string;
      cellClass: string;
      dataId: string;
      id: string;
      type: "Employee" | "Department";
    }) => (
      <td class={props.cellClass} rowspan="1" colspan="1">
        <div
          id={props.id}
          data-id={props.dataId}
          class={`weapp-form-widget weapp-form-field weapp-form-widget__${props.type} weapp-form-widget--read-only weapp-form-excel-style-${props.id} weapp-form-widget__excel`}
          data-style="weapp-form-widget"
        >
          <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
            <div class="weapp-form-widget-content-container">
              <div class="ui-browser is-single weapp-form-related-browser">
                <div class="ui-browser-associative-selected-wrap is-single is-readOnly ui-browser-associative is-single is-readOnly">
                  <div class="ui-browser-associative-selected-box">
                    <div class="ui-browser-associative-selected selected-wrap hidden-more-btn">
                      <div class="ui-list ui-list-column ui-browser-associative-selected-list">
                        <div class="ui-list-body">
                          <div class="ui-list-item ui-list-item-noorder ui-list-unsortable">
                            <div class="ui-list-content">
                              <div class="ui-browser-associative-selected-item is-clickable is-readonly">
                                <div class="ui-list-item-col ui-list-item-col-0">
                                  <div>
                                    <div class="ui-list-item-row">
                                      <span class="ui-browser-panel-list-template-content-wrapper">
                                        <span>{props.value}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    );

    const TextWidget = (props: {
      value: string;
      cellClass: string;
      dataId: string;
      id: string;
      colspan?: number;
      rowspan?: number;
      type?: "Text" | "TextArea" | "Number";
      empty?: boolean;
    }) => (
      <td
        class={props.cellClass}
        rowspan={props.rowspan || 1}
        colspan={props.colspan || 1}
      >
        <div
          id={props.id}
          data-id={props.dataId}
          class={`weapp-form-widget weapp-form-field weapp-form-widget__${
            props.type || "Text"
          } weapp-form-widget--read-only ${
            props.empty ? "weapp-form-widget--empty" : ""
          } weapp-form-excel-style-${props.id} weapp-form-widget__excel`}
          data-style="weapp-form-widget"
        >
          <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
            <div class="weapp-form-widget-content-container">
              <div
                class={`weapp-form-${
                  props.type === "TextArea" ? "textarea" : "input"
                }-wrapper weapp-form-widget-size--large`}
                data-id={props.dataId}
              >
                <span
                  class={`ui-${
                    props.type === "TextArea" ? "textarea" : "input"
                  } is-readonly ${
                    props.type === "TextArea" ? "resizable auto-height" : ""
                  }`}
                  style={
                    props.type === "TextArea"
                      ? "max-width: 100%; resize: none;"
                      : ""
                  }
                >
                  {props.value}
                </span>
              </div>
            </div>
          </div>
        </div>
      </td>
    );

    const DateWidget = (props: {
      value: string;
      cellClass: string;
      dataId: string;
      id: string;
      type: "Date" | "DateRange";
    }) => (
      <td class={props.cellClass} rowspan="1" colspan="1">
        <div
          id={props.id}
          data-id={props.dataId}
          class={`weapp-form-widget weapp-form-field weapp-form-widget__${props.type} weapp-form-widget--read-only weapp-form-excel-style-${props.id} weapp-form-widget__excel`}
          data-style="weapp-form-widget"
        >
          <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
            <div class="weapp-form-widget-content-container">
              <div
                class={`weapp-form-${
                  props.type === "DateRange" ? "date-range" : "date"
                }-wrapper`}
                data-id={props.dataId}
              >
                <div class="ui-date-time-picker ui-date-time-picker-readOnly">
                  <span class="date-span">{props.value}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    );

    const SelectWidget = (props: {
      value: string;
      cellClass: string;
      dataId: string;
      id: string;
    }) => (
      <td class={props.cellClass} rowspan="1" colspan="1">
        <div
          id={props.id}
          data-id={props.dataId}
          class={`weapp-form-widget weapp-form-field weapp-form-widget__Select weapp-form-widget--read-only weapp-form-excel-style-${props.id} weapp-form-widget__excel`}
          data-style="weapp-form-widget"
        >
          <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
            <div class="weapp-form-widget-content-container">
              <div
                class="weapp-form-select-wrapper weapp-form-widget-size--large"
                data-id={props.dataId}
              >
                <div
                  class="ui-select is-single weapp-form-select"
                  tabindex="1"
                  style="
                width: 100%;
                height: 100%;
                line-height: normal;
              "
                >
                  <div class="ui-select-readonly ui-select-readonly-selectedWrap ui-select-readonly-showwrap">
                    <span class="ui-tag ui-tag-small ui-tag-normal">
                      <div class="ui-tag-text">
                        <span class="ui-select-input-selected">
                          {props.value}
                        </span>
                      </div>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    );

    const CommentCard = (props: {
      name: string;
      avatar: string;
      date: string;
      time: string;
      client: string;
      type: string;
      content: any;
      isFirst?: boolean;
      avatarColor?: string;
    }) => (
      <div
        class={`wffp-comments-card wffp-comments-card-PC-1 ${
          props.isFirst ? "wffp-comments-card-show-item" : ""
        }`}
        style="border-bottom-style: dashed; border-bottom-color: rgb(229, 229, 229);"
      >
        <div class="wffp-comments-card-main">
          <div class="wffp-comments-card-body wffp-comments-card-PcTemplate1">
            <div class="wffp-comments-card-content">
              <div class="wffp-comments-card-content-center">
                <div class="wffp-comments-card-avatar">
                  <span class="ui-comment-avatar-container">
                    <div class="ui-avatar ui-avatar-md ui-avatar-circle ui-comment-item-avatar">
                      <span
                        class="ui-avatar-bg"
                        style={`color: rgb(255, 255, 255); background-color: ${
                          props.avatarColor || "rgb(239, 139, 186)"
                        };`}
                      >
                        {props.avatar}
                      </span>
                    </div>
                  </span>
                </div>
                <div class="wffp-comments-card-content-main">
                  <div class="wffp-comments-card-flex">
                    <div class="wffp-comments-card-userName">
                      <div
                        class="weapp-workflow-comments-card-username-normal"
                        style="display: inline-block;"
                      >
                        <span>{props.name}</span>
                      </div>
                    </div>
                  </div>
                  <div class="wffp-comments-card-row" style="display: flex;">
                    <div class="wffp-comments-card-contentText">
                      <div class="wffp-comments-item-content">
                        <div class="ui-comment-item-text-container">
                          <div class="ui-comment-item-text ui-comment-item-text-rich">
                            <div class="ui-rich-text ui-comment-html ui-rich-text-cke-readonly">
                              {props.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="wffp-comments-card-row" style="display: flex;">
                    <div class="wffp-comments-card-operateDate">
                      <span>{props.date}</span>
                    </div>
                    <div class="wffp-comments-card-operateTime">
                      <span>{props.time}</span>
                    </div>
                    <div class="wffp-comments-card-client">
                      <span>
                        <i>来自 {props.client}</i>
                      </span>
                    </div>
                    <div class="wffp-comments-card-operateType">
                      <span>
                        【<span class="wf-sign-operate-type">{props.type}</span>
                        】
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const MobileTextWidget = (props: {
      id?: string;
      dataId?: string;
      type?: "Text" | "TextArea" | "Number" | "SerialNum";
      title: string;
      value: string;
      hide?: boolean;
      empty?: boolean;
      desc?: string;
    }) => (
      <>
        {!props.hide && <div class="weapp-form-widget-divider"></div>}
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId || "undefined"}
          class={`weapp-form-widget-m weapp-form-widget--hoz weapp-form-field weapp-form-widget__${
            props.type || "Text"
          } weapp-form-widget--read-only ${
            props.hide ? "weapp-form-widget--hide" : ""
          } ${props.empty ? "weapp-form-widget--empty" : ""}`}
          data-style="weapp-form-widget-m"
        >
          <div class="weapp-form-widget-wrapper">
            <div class="weapp-form-widget-title">
              <span class="weapp-form-widget-title-text">{props.title}</span>
            </div>
            <div class="weapp-form-widget-content weapp-form-widget-content--FLOW">
              <div class="weapp-form-widget-content-container">
                {props.type === "SerialNum" ? (
                  <div
                    class="weapp-form-serial-num-wrapper-m "
                    data-id={props.dataId}
                  >
                    <label>{props.value}</label>
                  </div>
                ) : props.type === "TextArea" ? (
                  <div
                    class="weapp-form-textarea-wrapper-m"
                    data-id={props.dataId}
                  >
                    <div class="ui-m-list-item ui-m-textarea-item">
                      <div class="ui-m-textarea-control">
                        <span class="ui-m-textarea-readonly">
                          {props.value}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    class="weapp-form-input-wrapper-m"
                    data-id={props.dataId}
                  >
                    <div class="ui-m-list-item ui-m-input-item ui-m-list-item-middle ui-m-input-readonly">
                      <div class="ui-m-list-line">
                        <div class="ui-m-input-control is-readonly">
                          <span>{props.value}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {props.desc && <div class="weapp-form-widget-desc">{props.desc}</div>}
        </div>
      </>
    );

    const MobileDateWidget = (props: {
      id?: string;
      dataId?: string;
      type: "Date" | "DateRange";
      title: string;
      value: string | string[];
    }) => (
      <>
        <div class="weapp-form-widget-divider"></div>
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId || "undefined"}
          class={`weapp-form-widget-m weapp-form-widget--hoz weapp-form-field weapp-form-widget__${props.type} weapp-form-widget--read-only`}
          data-style="weapp-form-widget-m"
        >
          <div class="weapp-form-widget-wrapper">
            <div class="weapp-form-widget-title">
              <span class="weapp-form-widget-title-text">{props.title}</span>
            </div>
            <div class="weapp-form-widget-content weapp-form-widget-content--FLOW">
              <div class="weapp-form-widget-content-container">
                <div
                  class={`weapp-form-date${props.type === "DateRange" ? "-range" : ""}-wrapper-m ${props.type === "DateRange" ? "weapp-form-date-range-padding-m" : ""}`}
                  data-id={props.dataId}
                >
                  {(Array.isArray(props.value)
                    ? props.value
                    : [props.value]
                  ).map((v) => (
                    <div class="ui-m-date-time-picker ui-m-date-time-picker-readOnly ui-m-date-time-picker-hideIcon">
                      <div class="ui-m-date-time-picker-item">
                        <div class="ui-formItem-item">
                          <div class="ui-formItem-item-content">{v}</div>
                          <div class="ui-formItem-item-icon">
                            <span class="ui-icon ui-icon-wrapper">
                              <svg
                                class="ui-icon-xs ui-icon-svg Icon-Right-arrow01"
                                fill="currentColor"
                              >
                                <use xlinkHref="#Icon-Right-arrow01"></use>
                              </svg>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    const MobileBrowserWidget = (props: {
      id?: string;
      dataId?: string;
      type: "Employee" | "Department";
      title: string;
      value: string;
      hide?: boolean;
      empty?: boolean;
    }) => (
      <>
        {!props.hide && <div class="weapp-form-widget-divider"></div>}
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId || "undefined"}
          class={`weapp-form-widget-m weapp-form-widget--hoz weapp-form-field weapp-form-widget__${props.type} weapp-form-widget--read-only ${props.empty ? "weapp-form-widget--empty" : ""} ${props.hide ? "weapp-form-widget--hide" : ""}`}
          data-style="weapp-form-widget-m"
        >
          <div class="weapp-form-widget-wrapper">
            <div class="weapp-form-widget-title">
              <span class="weapp-form-widget-title-text">{props.title}</span>
            </div>
            <div class="weapp-form-widget-content weapp-form-widget-content--FLOW">
              <div class="weapp-form-widget-content-container">
                <div
                  class="weapp-form-related-wrapper-m"
                  data-id={props.dataId}
                >
                  <div
                    class={`ui-m-browser ${props.empty ? "is-empty" : ""} is-multiple is-multiline weapp-form-related-m`}
                  >
                    <div
                      class={`ui-m-browser-associative is-multiple is-readonly ${props.empty ? "is-empty" : ""} no-label align-right`}
                    >
                      <div
                        class={`ui-formItem-item ui-m-browser-associative-inner ${props.empty ? "is-placeholder" : ""}`}
                      >
                        <div class="ui-formItem-item-placeholder">
                          {!props.empty && (
                            <div class="ui-m-browser-associative-selected is-multiple">
                              <div
                                class="ui-m-list-scrollview ui-m-list ui-m-list-column ui-m-browser-associative-selected-list"
                                style="height: auto;"
                              >
                                <div
                                  class="ui-m-list-scrollview-content"
                                  style="min-width: 100%;"
                                >
                                  <div class="ui-m-list-body">
                                    <div
                                      class="ui-m-list-item ui-m-list-item-noorder ui-m-list-unsortable"
                                      style="padding-left: 0px;"
                                    >
                                      <div class="ui-m-list-content">
                                        <div class="ui-m-browser-associative-selected-item is-readonly">
                                          <div class="ui-m-list-item-col ui-m-list-item-col-0">
                                            <div>
                                              <div class="ui-m-list-item-row">
                                                <span class="ui-browser-panel-list-template-content-wrapper">
                                                  <span>{props.value}</span>
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div class="ui-formItem-item-icon">
                          <span class="ui-icon ui-icon-wrapper">
                            <svg
                              class="ui-icon-xs ui-icon-svg Icon-Right-arrow01"
                              fill="currentColor"
                            >
                              <use xlinkHref="#Icon-Right-arrow01"></use>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    const MobileSelectWidget = (props: {
      id?: string;
      dataId?: string;
      title: string;
      value: string;
    }) => (
      <>
        <div class="weapp-form-widget-divider"></div>
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId || "undefined"}
          class="weapp-form-widget-m weapp-form-widget--hoz weapp-form-field weapp-form-widget__Select weapp-form-widget--read-only"
          data-style="weapp-form-widget-m"
        >
          <div class="weapp-form-widget-wrapper">
            <div class="weapp-form-widget-title">
              <span class="weapp-form-widget-title-text">{props.title}</span>
            </div>
            <div class="weapp-form-widget-content weapp-form-widget-content--FLOW">
              <div class="weapp-form-widget-content-container">
                <div data-id={props.dataId}>
                  <div class="ui-m-select ui-m-select-isHoldRight is-readonly">
                    <div class="ui-m-select-input-wrap ui-m-select-readonly-selectedWrap ui-m-select-selected-showwrap">
                      <span class="ui-tag ui-tag-small ui-tag-normal">
                        <div class="ui-tag-text">
                          <span class="ui-m-select-input-selected ui-tag-default">
                            {props.value}
                          </span>
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    const MobileCollapse = (
      props: {
        id?: string;
        dataId?: string;
        title: string;
        ebcomId: string;
      },
      { slots }: any,
    ) => (
      <>
        <div class="weapp-form-widget-divider"></div>
        <div
          id={props.id || "widget_undefined"}
          data-id={props.dataId || "undefined"}
          class="weapp-form-layout-m weapp-form-widget-m weapp-form-widget__Collapse weapp-form-widget--read-only weapp-form--no-padding"
          data-style="weapp-form-widget-m"
        >
          <div class="weapp-form-collapse-wrapper-m" data-id={props.dataId}>
            <div class="ui-m-collapse ui-m-collapse--has-border ui-m-collapse-normal">
              <div class="ui-m-collapse-panel weapp-form-collapse-m ui-m-collapse-panel--has-arrow ui-m-collapse-panel--active">
                <div class="ui-m-collapse-panel__title ui-m-collapse-panel__title--bg-default">
                  <span class="ui-m-collapse-panel__arrow-right"></span>
                  <div class="weapp-form-collapse-title-m">
                    <div class="weapp-form-collapse-title-container">
                      {props.title}
                    </div>
                  </div>
                </div>
                <div
                  class="ui-m-collapse-panel__content-box"
                  style="border-bottom-width: 0px; border-bottom-color: rgba(255, 255, 255, 0); transition: height 160ms cubic-bezier(0.5, 0, 0.5, 0.1); overflow: hidden; height: auto;"
                >
                  <div class="ui-m-collapse-panel__content">
                    <div class="weapp-form-collapse-content-m">
                      <div class="ebcom" id={props.ebcomId}>
                        {slots.default?.()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    const MobileCommentCard = (props: {
      avatar: string;
      avatarColor: string;
      name: string;
      content: any;
      date: string;
      time: string;
      type: string;
      client: string;
      hasQuote?: boolean;
    }) => (
      <div
        class="mwffp-comments-card mwffp-comments-card-undefined mwffp-comments-card-MOBILE-8"
        style="border-bottom-style: unset;"
      >
        <div class="mwffp-comments-card-main">
          <div class="mwffp-comments-card-body mwffp-comments-card-MTemplate1">
            <div class="mwffp-comments-card-row" style="display: flex;">
              <div class="mwffp-comments-card-avatar">
                <span class="ui-m-comment-avatar-container">
                  <div class="ui-m-avatar ui-m-avatar-lg ui-m-avatar-circle ui-m-comment-item-avatar">
                    <span
                      class="ui-m-avatar-bg"
                      style={{
                        color: "rgb(255, 255, 255)",
                        background: props.avatarColor,
                      }}
                    >
                      {props.avatar}
                    </span>
                  </div>
                </span>
              </div>
              <div class="mwffp-comments-card-right">
                <div class="mwffp-comments-card-flex">
                  <div class="mwffp-comments-card-userName">
                    <div
                      class="weapp-workflow-comments-card-username-normal"
                      style="display: inline-block;"
                    >
                      <span>{props.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="mwffp-comments-card-content-main">
              <div class="mwffp-comments-card-row" style="display: flex;">
                <div class="mwffp-comments-card-contentText">
                  <div class="wffp-comments-item-content">
                    <div
                      class={`ui-m-comment-item-text ${
                        typeof props.content !== "string"
                          ? "ui-m-comment-item-text-rich"
                          : ""
                      } ui-m-comment-text`}
                    >
                      <div class="ui-m-rich-text ui-comment-html ui-m-rich-text-cke-readonly ui-m-rich-text-scroll">
                        {typeof props.content === "string" ? (
                          <p>{props.content}</p>
                        ) : (
                          props.content
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mwffp-comments-card-row" style="display: flex;">
                <div class="mwffp-comments-card-operateDate">
                  <span>{props.date}</span>
                </div>
                <div class="mwffp-comments-card-operateTime">
                  <span>{props.time}</span>
                </div>
                <div class="mwffp-comments-card-operateType">
                  <span>
                    【<span class="wf-sign-operate-type">{props.type}</span>】
                  </span>
                </div>
              </div>
              <div class="mwffp-comments-card-row" style="display: flex;">
                <div class="mwffp-comments-card-client">
                  <span>来自 {props.client}</span>
                </div>
              </div>
              <div
                class="mwffp-comments-card-operateOptions"
                style="opacity: 1;"
              >
                <div class="ui-m-comment-item-footer-set">
                  <div
                    class="ui-m-comment-item-footer-wrap"
                    style="position: absolute;"
                  >
                    <div class="ui-m-comment-item-footer-btns">
                      {props.hasQuote && (
                        <div class="ui-m-comment-iconbtn">
                          <span class="ui-icon ui-icon-wrapper">
                            <svg
                              class="ui-icon-s ui-icon-svg Icon-quote01"
                              fill="currentColor"
                            >
                              <use xlinkHref="#Icon-quote01"></use>
                            </svg>
                          </span>
                        </div>
                      )}
                      <div class="ui-m-comment-iconbtn">
                        <span class="ui-icon ui-icon-wrapper">
                          <svg
                            class="ui-icon-s ui-icon-svg Icon-Transfer"
                            fill="currentColor"
                          >
                            <use xlinkHref="#Icon-Transfer"></use>
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );

    const renderPC = () => {
      return (
        <div id="root">
          <div class="wffp-frame-dialog wffp-frame-dialog-main wffp-frame-dialog-workflow wffp-frame-full wffp-frame-full wffp-frame-fullView_1207388068004192450_1769350746875">
            <div class="ui-layout-row ui-title ui-title-hasMenu ui-title-noTitle ui-title-inDialog ui-title-inDialog-hasMenu">
              <div class="ui-layout-col ui-layout-col-12 ui-title-col">
                <div class="ui-title-left ui-title-left-tabs">
                  <div
                    class="ui-title-icon"
                    style="border-color: rgb(104, 165, 255)"
                  >
                    <div class="ui-title-icon-border">
                      <span class="ui-icon ui-icon-wrapper">
                        <svg
                          class="ui-icon-sm ui-icon-svg Icon-Approval-process-o"
                          fill="currentColor"
                          style="color: rgb(104, 165, 255)"
                        >
                          <use xlinkHref="#Icon-Approval-process-o"></use>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div class="ui-title-title">
                    <div class="ui-title-title-top">
                      <div class="wffp-frame-top-title">
                        <span class="wffp-frame-top-title-wfname">
                          <p style="display: inline">
                            <span>
                              请假申请-{template.value.name}-
                              {dayjs(template.value.submitTime).format(
                                "YYYY-MM-DD",
                              )}
                            </span>
                            &nbsp;-&nbsp;
                            <span>结束</span>&nbsp;
                          </p>
                        </span>
                      </div>
                    </div>
                    <div class="ui-menu ui-menu-tab ui-menu-limit ui-menu-hasmore ui-menu-tab-top ui-menu-hideBottomLine">
                      <div class="ui-menu-tab-top-container">
                        <div class="ui-menu-list">
                          <div
                            class="ui-menu-list-item ui-menu-list-item-active ui-menu-parent-icon"
                            id="main"
                            title="流程表单"
                          >
                            <div class="ui-menu-list-item-content-wrap">
                              <span class="ui-menu-list-item-content">
                                流程表单
                              </span>
                            </div>
                          </div>
                          <div
                            class="ui-menu-list-item ui-menu-parent-icon"
                            id="chart"
                            title="流程图"
                          >
                            <div class="ui-menu-list-item-content-wrap">
                              <span class="ui-menu-list-item-content">
                                流程图
                              </span>
                            </div>
                          </div>
                          <div
                            class="ui-menu-list-item ui-menu-parent-icon"
                            id="status"
                            title="流程状态"
                          >
                            <div class="ui-menu-list-item-content-wrap">
                              <span class="ui-menu-list-item-content">
                                流程状态
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ui-layout-col ui-layout-col-12 ui-title-col">
                <div class="ui-title-right">
                  <div class="ui-title-right-container">
                    <HeaderButton title="批准" type="primary" />
                    <HeaderButton title="保存" />
                    <HeaderButton title="退回" />
                    <div class="ui-menu ui-menu-select ui-menu-select-top">
                      <button class="ui-btn ui-btn-default ui-btn-middle ui-btn-inline">
                        更多
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="wffp-frame-full-body" style="margin-right: 0px">
              <div class="ui-right-menu wffp-right-menus" id="gsnc62">
                <div class="ui-spin-nested-loading">
                  <div class="ui-spin-container">
                    <div class="wffp-frame-content">
                      <div class="wffp-frame-main wffp-frame-tab wffp-frame-tab-active">
                        <div>
                          <div class="wffp-operate-area wffp-operate-area-empty">
                            <div></div>
                            <div class="weapp-workflow-wfpp-importwf"></div>
                            <div class="weapp-workflow-wfpp-flowinfo"></div>
                          </div>
                          <div class="wffp-prompt-tip"></div>
                          <div class="wffp-system-hide"></div>
                          <div
                            id="form_930467019515330563"
                            class="weapp-formbuilder-form"
                            style="position: relative"
                          >
                            <form
                              action="javascript:void(0)"
                              class="weapp-form weapp-form-view weapp-form-wrapper weapp-form-wrapper__bordered weapp-form__bordered weapp-form-view-excel"
                              style=""
                            >
                              <button
                                type="submit"
                                style="display: none"
                              ></button>
                              <div
                                id="weapp-form-layout__931308360491720704"
                                class="weapp-form-content"
                              >
                                <div
                                  class="weapp-de-excel-render ebpage ebpage-pc"
                                  id="ebpage_931308360491720704"
                                >
                                  <table
                                    cellpadding="0"
                                    cellspacing="0"
                                    class="weapp-de-excel-render-main"
                                    style="
                                  margin: 0px auto;
                                  table-layout: fixed;
                                  width: 900px;
                                  position: relative;
                                "
                                  >
                                    <colgroup>
                                      <col style="width: 150px" />
                                      <col style="width: 300px" />
                                      <col style="width: 150px" />
                                      <col style="width: 300px" />
                                    </colgroup>
                                    <tbody>
                                      <tr class=" " style="height: 60px">
                                        <td
                                          class="cell_Sheet1_0_0"
                                          rowspan="1"
                                          colspan="4"
                                        >
                                          <span style="white-space: normal">
                                            广东白云学院学生请假申请
                                          </span>
                                        </td>
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="流水号"
                                          cellClass="cell_Sheet1_1_0"
                                          dataId="fb67785100754c709c9face249060022"
                                        />
                                        <td
                                          class="cell_Sheet1_1_1"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_988369728495951894"
                                            data-id="f484d6690dfc412885269fd9ff10a69d"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__SerialNum weapp-form-widget--read-only weapp-form-excel-style-988369728495951894 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div
                                                  class="weapp-form-serial-num-wrapper"
                                                  data-id="f484d6690dfc412885269fd9ff10a69d"
                                                >
                                                  <label>
                                                    {requestId.value}
                                                  </label>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <LabelWidget
                                          text="提交时间"
                                          cellClass="cell_Sheet1_1_2"
                                          dataId="d06d61570e224933acba5809bd19470a"
                                        />
                                        <DateWidget
                                          value={submitTime.value}
                                          cellClass="cell_Sheet1_1_3"
                                          dataId="a056a19c88f64ca391c633963716f37c"
                                          id="988441742038032736"
                                          type="Date"
                                        />
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <td
                                          class="cell_Sheet1_2_0"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930472980804657153"
                                            data-id="d07e99afceae49338f9dfcbf1f488ac9"
                                            class=""
                                            data-style="weapp-form-widget"
                                          >
                                            <span class="weapp-form-widget-internal-title">
                                              <span class="">申请人</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_2_1"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930467285820080128"
                                            data-id="ee9e5a29dbd34d178a826da024533aa4"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__Employee weapp-form-widget--read-only weapp-form-excel-style-930467285820080128 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div class="ui-browser is-multiple weapp-form-related-browser">
                                                  <div class="ui-browser-associative-selected-wrap is-multiple is-readOnly ui-browser-associative is-multiple is-readOnly">
                                                    <div class="ui-browser-associative-selected-box">
                                                      <div class="ui-browser-associative-selected selected-wrap hidden-more-btn is-multiple">
                                                        <div class="ui-list ui-list-column ui-browser-associative-selected-list">
                                                          <div
                                                            class="ui-list-body"
                                                            global-resizeobserver-key="0.8666909268710927"
                                                          >
                                                            <div class="ui-list-item ui-list-item-noorder ui-list-unsortable">
                                                              <div class="ui-list-content">
                                                                <div class="ui-browser-associative-selected-item is-clickable is-readonly">
                                                                  <div class="ui-list-item-col ui-list-item-col-0">
                                                                    <div>
                                                                      <div class="ui-list-item-row">
                                                                        <span class="ui-browser-panel-list-template-content-wrapper">
                                                                          <span>
                                                                            {
                                                                              template
                                                                                .value
                                                                                .name
                                                                            }
                                                                          </span>
                                                                        </span>
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_2_2"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930472980804657154"
                                            data-id="ca5d9a1a08c34572a0b0a9099cf6ebc6"
                                            class=""
                                            data-style="weapp-form-widget"
                                          >
                                            <span class="weapp-form-widget-internal-title">
                                              <span class="">学号</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_2_3"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930467285820080129"
                                            data-id="fab072ef33844d7aa0c7fe0093e2d08a"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__Text weapp-form-widget--read-only weapp-form-excel-style-930467285820080129 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div
                                                  class="weapp-form-input-wrapper weapp-form-widget-size--large"
                                                  data-id="fab072ef33844d7aa0c7fe0093e2d08a"
                                                >
                                                  <span class="ui-input is-readonly">
                                                    {template.value.number}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <td
                                          class="cell_Sheet1_3_0"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930472980804657155"
                                            data-id="d2ab34fb63b344d29292ea04c436b176"
                                            class=""
                                            data-style="weapp-form-widget"
                                          >
                                            <span class="weapp-form-widget-internal-title">
                                              <span class="">班级</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_3_1"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930467285820080130"
                                            data-id="fab6ab3c62ef4ccab88fefa80ac3d9b6"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__Department weapp-form-widget--read-only weapp-form-excel-style-930467285820080130 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div class="ui-browser is-multiple weapp-form-related-browser">
                                                  <div class="ui-browser-associative-selected-wrap is-multiple is-readOnly ui-browser-associative is-multiple is-readOnly">
                                                    <div class="ui-browser-associative-selected-box">
                                                      <div class="ui-browser-associative-selected selected-wrap hidden-more-btn is-multiple">
                                                        <div class="ui-list ui-list-column ui-browser-associative-selected-list">
                                                          <div
                                                            class="ui-list-body"
                                                            global-resizeobserver-key="0.7214871543513006"
                                                          >
                                                            <div class="ui-list-item ui-list-item-noorder ui-list-unsortable">
                                                              <div class="ui-list-content">
                                                                <div class="ui-browser-associative-selected-item is-clickable is-readonly">
                                                                  <div class="ui-list-item-col ui-list-item-col-0">
                                                                    <div>
                                                                      <div class="ui-list-item-row">
                                                                        <span class="ui-browser-panel-list-template-content-wrapper">
                                                                          <span>
                                                                            {
                                                                              template
                                                                                .value
                                                                                .class
                                                                            }
                                                                          </span>
                                                                        </span>
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_3_2"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930472980804657156"
                                            data-id="b5210e348ad54114a83f8efec7c932e0"
                                            class=""
                                            data-style="weapp-form-widget"
                                          >
                                            <span class="weapp-form-widget-internal-title">
                                              <span class="">院系</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td
                                          class="cell_Sheet1_3_3"
                                          rowspan="1"
                                          colspan="1"
                                        >
                                          <div
                                            id="widget_930467285820080131"
                                            data-id="c7f3c3bf19bf4ba8b80609d3368c3c9f"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__Department weapp-form-widget--read-only weapp-form-excel-style-930467285820080131 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div class="ui-browser is-single weapp-form-related-browser">
                                                  <div class="ui-browser-associative-selected-wrap is-single is-readOnly ui-browser-associative is-single is-readOnly">
                                                    <div class="ui-browser-associative-selected-box">
                                                      <div class="ui-browser-associative-selected selected-wrap hidden-more-btn">
                                                        <div class="ui-list ui-list-column ui-browser-associative-selected-list">
                                                          <div
                                                            class="ui-list-body"
                                                            global-resizeobserver-key="0.6791395782755005"
                                                          >
                                                            <div class="ui-list-item ui-list-item-noorder ui-list-unsortable">
                                                              <div class="ui-list-content">
                                                                <div class="ui-browser-associative-selected-item is-clickable is-readonly">
                                                                  <div class="ui-list-item-col ui-list-item-col-0">
                                                                    <div>
                                                                      <div class="ui-list-item-row">
                                                                        <span class="ui-browser-panel-list-template-content-wrapper">
                                                                          <span>
                                                                            {
                                                                              template
                                                                                .value
                                                                                .department
                                                                            }
                                                                          </span>
                                                                        </span>
                                                                      </div>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="请假类别"
                                          cellClass="cell_Sheet1_4_0"
                                          dataId="fa9f06a8c18b49f489459dcb8cf1e627"
                                          id="widget_930472980804657157"
                                        />
                                        <SelectWidget
                                          value={template.value.type}
                                          cellClass="cell_Sheet1_4_1"
                                          dataId="f34f805fb9d54cd08a7c59acc44cd796"
                                          id="930467285820080132"
                                        />
                                        <LabelWidget
                                          text="辅导员"
                                          cellClass="cell_Sheet1_4_2"
                                          dataId="fc211edf59a94b269269ed390d029cff"
                                          id="widget_930472980804657158"
                                        />
                                        <BrowserWidget
                                          value={
                                            getUserById(
                                              template.value.counselor,
                                            )?.name || "-"
                                          }
                                          cellClass="cell_Sheet1_4_3"
                                          dataId="e8711463714c4e5194220ab5161c32d2"
                                          id="930467290006544385"
                                          type="Employee"
                                        />
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="请假时间"
                                          cellClass="cell_Sheet1_5_0"
                                          dataId="fc769dc48636494b922ea09647bfd546"
                                          id="widget_930472980804657159"
                                        />
                                        <DateWidget
                                          value={getTimeRange(
                                            template.value.time,
                                          )}
                                          cellClass="cell_Sheet1_5_1"
                                          dataId="f9df8832a4e04c6d852ff6d8fb85c4c4"
                                          id="930467290006544386"
                                          type="DateRange"
                                        />
                                        <LabelWidget
                                          text="请假总时间"
                                          cellClass="cell_Sheet1_5_2"
                                          dataId="f06e82d374474e9fab27c3fef621e0a1"
                                          id="widget_930472980804657160"
                                        />
                                        <TextWidget
                                          value={`共${totalTime.value}`}
                                          cellClass="cell_Sheet1_5_3"
                                          dataId="cb3c66baafa44db4b6a3e96861a64948"
                                          id="930467994347077635"
                                        />
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="请假事由"
                                          cellClass="cell_Sheet1_6_0"
                                          dataId="e9b02d3095db431e8f08bffcc67316cd"
                                          id="widget_930472980804657161"
                                        />
                                        <TextWidget
                                          value={template.value.reason}
                                          cellClass="cell_Sheet1_6_1"
                                          dataId="f5a9751e976a4b9a80625f0710239a7a"
                                          id="930467290006544387"
                                          colspan={3}
                                          type="TextArea"
                                        />
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="涉及课程"
                                          cellClass="cell_Sheet1_7_0"
                                          dataId="ee0b150a7c134ffeb6ae3e6a46bca349"
                                          id="widget_930472980804657162"
                                        />
                                        <TextWidget
                                          value={template.value.courses.join(
                                            ", ",
                                          )}
                                          cellClass="cell_Sheet1_7_1"
                                          dataId="eb3f19a1408343978e8430c02a2b68c9"
                                          id="930467290006544388"
                                          colspan={3}
                                          type="TextArea"
                                          empty={
                                            template.value.courses.length === 0
                                          }
                                        />
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="抄送"
                                          cellClass="cell_Sheet1_8_0"
                                          dataId="dc4099087f784a85b1f68eac06cb98f0"
                                        />
                                        <td
                                          class="cell_Sheet1_8_1"
                                          rowspan="1"
                                          colspan="3"
                                        >
                                          <div
                                            id="widget_1137138174220984328"
                                            data-id="bf6980fc3bed430fb159a2dcc671496a"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__Employee weapp-form-widget--read-only weapp-form-widget--empty weapp-form-excel-style-1137138174220984328 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-desc">
                                                将本次请假信息发送给任课老师
                                              </div>
                                              <div class="weapp-form-widget-content-container">
                                                <div class="ui-browser is-empty is-multiple weapp-form-related-browser"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr class=" " style="height: 40px">
                                        <LabelWidget
                                          text="附件上传"
                                          cellClass="cell_Sheet1_9_0"
                                          dataId="ce38823f0929435ea905b337cb138b25"
                                        />
                                        <td
                                          class="cell_Sheet1_9_1"
                                          rowspan="1"
                                          colspan="3"
                                        >
                                          <div
                                            id="widget_988344297793265700"
                                            data-id="b421a84fa4c84b37aab54253c6d2fcef"
                                            class="weapp-form-widget weapp-form-field weapp-form-widget__File weapp-form-widget--read-only weapp-form-excel-style-988344297793265700 weapp-form-widget__excel"
                                            data-style="weapp-form-widget"
                                          >
                                            <div class="weapp-form-widget-content weapp-form-widget-content--EXCEL weapp-form--no-padding">
                                              <div class="weapp-form-widget-content-container">
                                                <div
                                                  class="weapp-form-file-upload-wrapper"
                                                  data-id="b421a84fa4c84b37aab54253c6d2fcef"
                                                ></div>
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                      <tr
                                        class=" "
                                        style="height: 0px; visibility: hidden"
                                      >
                                        <LabelWidget
                                          text="请假天数"
                                          cellClass="cell_Sheet1_10_0 excel-hide"
                                          dataId="ed45ebc3e8db4719b8b0e85348b20ffc"
                                        />
                                        <TextWidget
                                          value="1.4"
                                          cellClass="cell_Sheet1_10_1 excel-hide"
                                          dataId="bdb506bbae694b319fae5c062636d7a7"
                                          id="930477271426105344"
                                          type="Number"
                                        />
                                        <LabelWidget
                                          text="发起人所属学院党组织书记"
                                          cellClass="cell_Sheet1_10_2 excel-hide"
                                          dataId="e02ea80215f5402eb8d6f843b7c86b8a"
                                        />
                                        <BrowserWidget
                                          value="冯绮玲"
                                          cellClass="cell_Sheet1_10_3 excel-hide"
                                          dataId="b8fd68da00f342aaaafe2576d6889164"
                                          id="931589801233973249"
                                          type="Employee"
                                        />
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </form>
                            <span></span>
                            <span></span>
                          </div>
                          <div style="padding-bottom: 0px"></div>
                          <div
                            id="weapp-workflow-flowpage-formContentSigninput"
                            style="margin-bottom: 16px; margin-top: 16px"
                          >
                            <div class="ui-spin-nested-loading">
                              <div class="ui-spin-container">
                                <div
                                  class="wffp-signinput"
                                  style="display: block"
                                >
                                  <div
                                    class="wffp-signinput-label"
                                    style="display: block"
                                  >
                                    <span class="ui-icon ui-icon-wrapper wffp-signinput-label-icon">
                                      <svg
                                        class="ui-icon-s ui-icon-svg Icon-Attachment-editor"
                                        fill="currentColor"
                                      >
                                        <use xlinkHref="#Icon-Attachment-editor"></use>
                                      </svg>
                                    </span>
                                    <span class="wffp-signinput-label-desc">
                                      签字意见
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div></div>
                          </div>
                          <div style="margin-top: 16px">
                            <div class="flowpage-comment weapp-workflow-comment-list">
                              <div class="ui-comment">
                                <div class="ui-comment-top">
                                  <div class="ui-menu ui-menu-tab ui-menu-hasmore ui-menu-tab-top ui-comment-tabs">
                                    <div class="ui-menu-tab-top-container">
                                      <div class="ui-menu-list">
                                        <div
                                          class="ui-menu-list-item ui-menu-list-item-active ui-menu-parent-icon"
                                          id="main"
                                          title="流转意见"
                                        >
                                          <div class="ui-menu-list-item-content-wrap">
                                            <span class="ui-menu-list-item-content">
                                              流转意见
                                            </span>
                                          </div>
                                        </div>
                                        <div
                                          class="ui-menu-list-item ui-menu-parent-icon"
                                          id="related"
                                          title="与我相关"
                                        >
                                          <div class="ui-menu-list-item-content-wrap">
                                            <span class="ui-menu-list-item-content">
                                              与我相关
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="ui-menu-extra">
                                      <div class="ui-comment-top-btns">
                                        <span class="ui-icon ui-icon-wrapper ui-comment-more-icon">
                                          <svg
                                            class="ui-icon-xs ui-icon-svg Icon-Advanced-search"
                                            fill="currentColor"
                                          >
                                            <use xlinkHref="#Icon-Advanced-search"></use>
                                          </svg>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div class="ui-comment-more">
                                  <div
                                    style="
                                  transition: height 300ms;
                                  overflow: hidden;
                                  height: 0px;
                                "
                                  ></div>
                                </div>
                                <div class="ui-comment-content">
                                  <div class="ui-comment-list">
                                    <div
                                      class="ui-list-scrollview-wrap"
                                      style="height: auto; width: 100%"
                                    >
                                      <div
                                        class="ui-scroller"
                                        style="height: 100%"
                                      >
                                        <div
                                          class="ui-scroller__wrap"
                                          style="
                                        margin-right: -8px;
                                        overflow-x: hidden;
                                      "
                                        >
                                          <div
                                            class="ui-scroller__view"
                                            style="position: relative"
                                          >
                                            <div class="ui-list-scrollview ui-list ui-list-column ui-comment-list-body ui-comment-list-nomore">
                                              <div
                                                class="ui-list-scrollview-content"
                                                style="min-width: 100%"
                                              >
                                                <div
                                                  class="ui-list-body"
                                                  data-id=""
                                                >
                                                  {template.value
                                                    .partySecretary !== "" &&
                                                    !!nextNextAuditCommit.value && (
                                                      <CommentCard
                                                        name={
                                                          getUserById(
                                                            template.value
                                                              .partySecretary,
                                                          )?.name || "-"
                                                        }
                                                        avatar={(
                                                          getUserById(
                                                            template.value
                                                              .partySecretary,
                                                          )?.name || "-"
                                                        ).slice(0, 1)}
                                                        date={dayjs(
                                                          nextNextAuditCommit.value,
                                                        ).format("YYYY-MM-DD")}
                                                        time={dayjs(
                                                          nextNextAuditCommit.value,
                                                        ).format("HH:mm:ss")}
                                                        client="pc web"
                                                        type="学院党组织书记审批：批准"
                                                        isFirst={true}
                                                        content={
                                                          <>
                                                            <p>同意</p>
                                                          </>
                                                        }
                                                      />
                                                    )}
                                                  <CommentCard
                                                    name={
                                                      getUserById(
                                                        template.value
                                                          .counselor,
                                                      )?.name || "-"
                                                    }
                                                    avatar={(
                                                      getUserById(
                                                        template.value
                                                          .counselor,
                                                      )?.name || "-"
                                                    ).slice(0, 1)}
                                                    date={dayjs(
                                                      nextAuditCommit.value,
                                                    ).format("YYYY-MM-DD")}
                                                    time={dayjs(
                                                      nextAuditCommit.value,
                                                    ).format("HH:mm:ss")}
                                                    client="企业微信"
                                                    type="辅导员审批：批准"
                                                    content={<p>同意</p>}
                                                    avatarColor={
                                                      getUserById(
                                                        template.value
                                                          .counselor,
                                                      )?.gender === "male"
                                                        ? "rgb(93, 156, 236)"
                                                        : ""
                                                    }
                                                  />
                                                  <CommentCard
                                                    name={template.value.name}
                                                    avatar={template.value.name.slice(
                                                      0,
                                                      1,
                                                    )}
                                                    date={dayjs(
                                                      template.value.submitTime,
                                                    ).format("YYYY-MM-DD")}
                                                    time={dayjs(
                                                      template.value.submitTime,
                                                    ).format("HH:mm:ss")}
                                                    client="iphone"
                                                    type="提交：提交"
                                                    content={null}
                                                    avatarColor="rgb(93, 156, 236)"
                                                  />
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderMobile = () => {
      return (
        <div
          class="ui-m-dialog-routeLayout ui-title-placeholder in_mobile"
          style="opacity: 1; transform: translate(0px, 0px);"
        >
          <div class="mwffp-frame  mwffp-frame-view_1207388068004192450_1769410616186">
            <div class="ui-spin-nested-loading">
              <div class="ui-spin-container">
                <div class="ui-layout ui-layout" style="height: 100%;">
                  <div class="ui-layout ui-layout-has-side ui-layout-children">
                    <div
                      class="ui-layout ui-layout-inner-container ui-layout ui-layout-children"
                      style="width: 100%;"
                    >
                      <div class="ui-layout ui-layout-has-side ui-layout-children">
                        <div
                          class="ui-layout-content layout-box-block content-col"
                          style="width: 100%;"
                        >
                          <div class="ui-layout-box mwffp-frame-content">
                            <div class="mwffp-content" style="height: 100%;">
                              <div>
                                <div
                                  id="form_930467019515330563"
                                  class="weapp-formbuilder-form"
                                  style="position: relative;"
                                >
                                  <form
                                    action="javascript:void(0)"
                                    class="weapp-form weapp-form-view weapp-form-wrapper weapp-form__bordered weapp-form-view-flow"
                                    style=""
                                  >
                                    <button
                                      type="submit"
                                      style="display: none;"
                                    ></button>
                                    <div
                                      id="weapp-form-layout__930473620787789825"
                                      class="weapp-form-content"
                                    >
                                      <div
                                        class="weapp-de-flow-render ebpage ebpage-m"
                                        id="ebpage_930473620787789825"
                                      >
                                        <div class="ebdpage-top"></div>
                                        <div class="ebdpage-content">
                                          <div class="weapp-ebpv-styled-flow weapp-ebpv-styled-flow-background">
                                            <MobileTextWidget
                                              type="SerialNum"
                                              title="流水号"
                                              value={requestId.value}
                                              id="widget_988369728495951894"
                                              dataId="bb8f516d27414a95bf990985eab7b709"
                                            />
                                            <MobileDateWidget
                                              type="Date"
                                              title="提交时间"
                                              value={submitTime.value}
                                              id="widget_988441742038032736"
                                              dataId="fdf8ca6492a545f984bbe188e294dd78"
                                            />

                                            <MobileCollapse
                                              title="个人信息"
                                              id="widget_1137142825798213658"
                                              dataId="e858bb34df6e4e6f99e5cdbbcdac1c3a"
                                              ebcomId="a42f9df161b14328bd8ae070da2e317f"
                                            >
                                              <MobileBrowserWidget
                                                type="Employee"
                                                title="申请人"
                                                value={template.value.name}
                                                id="widget_930467285820080128"
                                                dataId="be399f0f5a8e4c64afee7d2b4f239c90"
                                              />
                                              <MobileTextWidget
                                                type="Text"
                                                title="学号"
                                                value={template.value.number}
                                                id="widget_930467285820080129"
                                                dataId="ab2d0dc64b6a4d0ca0473efd905431c7"
                                              />
                                              <MobileBrowserWidget
                                                type="Department"
                                                title="班级"
                                                value={template.value.class}
                                                id="widget_930467285820080130"
                                                dataId="d340c773542e410fa5fa9558becc98ad"
                                              />
                                              <MobileBrowserWidget
                                                type="Department"
                                                title="院系"
                                                value={
                                                  template.value.department
                                                }
                                                id="widget_930467285820080131"
                                                dataId="e4aca97bfb9d483a8be13045e808741f"
                                              />
                                            </MobileCollapse>

                                            <MobileCollapse
                                              title="请假信息"
                                              id="widget_1137142825798213659"
                                              dataId="e78a92a081cf4b88b88ec3529385baba"
                                              ebcomId="b4f1969b3b7940f1a00d5975234684c2"
                                            >
                                              <MobileSelectWidget
                                                title="请假类别"
                                                value={template.value.type}
                                                id="widget_930467285820080132"
                                                dataId="c76c475a0603476f8b7128a259571e9d"
                                              />
                                              <MobileDateWidget
                                                type="DateRange"
                                                title="请假时间"
                                                value={[
                                                  dayjs(
                                                    template.value.time[0],
                                                  ).format("YYYY-MM-DD HH:mm"),
                                                  dayjs(
                                                    template.value.time[1],
                                                  ).format("YYYY-MM-DD HH:mm"),
                                                ]}
                                                id="widget_930467290006544386"
                                                dataId="c2a9a8dd597f419abd4addeb71fbb706"
                                              />
                                              <MobileTextWidget
                                                title="请假总时间"
                                                value={`共${totalTime.value}`}
                                                id="widget_930467994347077635"
                                                dataId="ef003ba8cbe3443cbef40b6ebc67ae6c"
                                              />
                                            </MobileCollapse>

                                            <MobileCollapse
                                              title="请假凭证信息"
                                              id="widget_1137142825798213660"
                                              dataId="c7edc55a4ed04f1b854c5c5a5aef2c1e"
                                              ebcomId="c446c00bd3064aeabbddeb2de8d62d05"
                                            >
                                              <MobileBrowserWidget
                                                type="Employee"
                                                title="辅导员"
                                                value={
                                                  getUserById(
                                                    template.value.counselor,
                                                  )?.name || "-"
                                                }
                                                id="widget_930467290006544385"
                                                dataId="ea6329a51aa144ddb5e04adb794f4e05"
                                              />
                                              <MobileBrowserWidget
                                                type="Employee"
                                                title="抄送"
                                                value=""
                                                empty={true}
                                                id="widget_1137138174220984328"
                                                dataId="e8d0710402534a6c9960a3633a2944c5"
                                              />
                                              <MobileTextWidget
                                                type="TextArea"
                                                title="涉及课程"
                                                value={template.value.courses.join(
                                                  ", ",
                                                )}
                                                empty={
                                                  template.value.courses
                                                    .length === 0
                                                }
                                                id="widget_930467290006544388"
                                                dataId="af66f5ff3e864a82848032daa778724e"
                                              />
                                              <MobileTextWidget
                                                type="TextArea"
                                                title="请假事由"
                                                value={template.value.reason}
                                                id="widget_930467290006544387"
                                                dataId="d0f511b668484dbfab45a2a131d3cd9d"
                                              />
                                              <div class="weapp-form-widget-divider"></div>
                                              <div
                                                id="widget_988344297793265700"
                                                data-id="b27906fb1d8f4ba8a3ca66baceda95f5"
                                                class="weapp-form-widget-m weapp-form-widget--hoz weapp-form-field weapp-form-widget__File weapp-form-widget--read-only"
                                                data-style="weapp-form-widget-m"
                                              >
                                                <div class="weapp-form-widget-wrapper">
                                                  <div class="weapp-form-widget-title">
                                                    <span class="weapp-form-widget-title-text">
                                                      附件上传
                                                    </span>
                                                  </div>
                                                  <div class="weapp-form-widget-content weapp-form-widget-content--FLOW">
                                                    <div class="weapp-form-widget-content-container">
                                                      <div
                                                        class="weapp-form-file-upload-wrapper-m"
                                                        data-id="b27906fb1d8f4ba8a3ca66baceda95f5"
                                                      ></div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </MobileCollapse>

                                            <MobileTextWidget
                                              type="Number"
                                              title="请假天数"
                                              value="1.4"
                                              hide={true}
                                              id="widget_930477271426105344"
                                              dataId="a387be98f27746e09edae04ebaf56309"
                                            />
                                            <MobileBrowserWidget
                                              type="Employee"
                                              title="发起人所属学院党组织书记"
                                              value={
                                                getUserById(
                                                  template.value.partySecretary,
                                                )?.name || "-"
                                              }
                                              hide={true}
                                              id="widget_931589801233973249"
                                              dataId="a7303527a69540b1a0d9316bc65de694"
                                            />
                                          </div>
                                        </div>
                                        <div class="ebdpage-bottom"></div>
                                        <div class="ebdpage-abs"></div>
                                      </div>
                                    </div>
                                  </form>
                                  <span></span>
                                  <span></span>
                                </div>
                                <div style="margin-top: 16px;">
                                  <div class="m-flowpage-comment-list weapp-workflow-comment-list ">
                                    <div class="" style="top: 0px;">
                                      <div class="ui-m-menu ui-m-menu-tab">
                                        <div class="ui-m-menu-wrap">
                                          <div class="ui-m-menu-top border-solid-then">
                                            <div class="ui-m-menu-top-left">
                                              <div
                                                class="ui-m-menu-top-header-mask ui-m-menu-top-header-mask-left"
                                                style="opacity: 0;"
                                              ></div>
                                              <div
                                                class="ui-m-menu-top-header-mask ui-m-menu-top-header-mask-right"
                                                style="opacity: 0;"
                                              ></div>
                                              <div class="ui-m-menu-list">
                                                <div
                                                  class="ui-m-menu-top-header-underline"
                                                  style="width: 28px; transform: translate3d(26px, 0px, 0px);"
                                                ></div>
                                                <div class="ui-m-menu-list-item-wrap">
                                                  <div
                                                    class="ui-m-menu-list-item ui-m-menu-list-item-active ui-m-menu-parent-icon"
                                                    id="main"
                                                    title="流转意见"
                                                  >
                                                    <span class="ui-m-menu-list-item-content ">
                                                      流转意见
                                                    </span>
                                                  </div>
                                                </div>
                                                <div class="ui-m-menu-list-item-wrap">
                                                  <div
                                                    class="ui-m-menu-list-item ui-m-menu-parent-icon"
                                                    id="related"
                                                    title="与我相关"
                                                  >
                                                    <span class="ui-m-menu-list-item-content ">
                                                      与我相关
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                            <div class="ui-m-menu-top-extra">
                                              <div class="ui-m-searchAdvanced ui-m-searchAdvanced-onlyShowIcon">
                                                <span class="ui-icon ui-icon-wrapper ui-m-searchAdvanced-saIcon">
                                                  <svg
                                                    class="ui-icon-sm ui-icon-svg Icon-Advanced-search"
                                                    fill="currentColor"
                                                  >
                                                    <use xlinkHref="#Icon-Advanced-search"></use>
                                                  </svg>
                                                </span>
                                                <div></div>
                                              </div>
                                            </div>
                                          </div>
                                          <div
                                            class="ui-m-menu-content ui-m-menu-content-break"
                                            style="display: none;"
                                          ></div>
                                        </div>
                                        <div
                                          class="ui-m-menu-mask"
                                          style="display: none;"
                                        ></div>
                                      </div>
                                    </div>
                                    <div
                                      class="ui-m-comment mShowComment"
                                      style="height: 100%;"
                                    >
                                      <div class="ui-m-comment-content">
                                        <div class="ui-m-comment-list-container">
                                          <div
                                            class="ui-m-list-scrollview ui-m-list ui-m-list-column ui-m-comment-list"
                                            style="height: 100%;"
                                          >
                                            <div
                                              class="ui-m-list-scrollview-content"
                                              style="min-width: 100%;"
                                            >
                                              <div
                                                class="ui-m-list-body"
                                                data-id=""
                                              >
                                                {template.value
                                                  .partySecretary !== "" &&
                                                  !!nextNextAuditCommit.value && (
                                                    <MobileCommentCard
                                                      name={
                                                        getUserById(
                                                          template.value
                                                            .partySecretary,
                                                        )?.name || "-"
                                                      }
                                                      avatar={(
                                                        getUserById(
                                                          template.value
                                                            .partySecretary,
                                                        )?.name || "-"
                                                      ).slice(0, 1)}
                                                      avatarColor={
                                                        getUserById(
                                                          template.value
                                                            .partySecretary,
                                                        )?.gender === "male"
                                                          ? "rgb(93, 156, 236)"
                                                          : "rgb(239, 139, 186)"
                                                      }
                                                      date={dayjs(
                                                        nextNextAuditCommit.value,
                                                      ).format("YYYY-MM-DD")}
                                                      time={dayjs(
                                                        nextNextAuditCommit.value,
                                                      ).format("HH:mm:ss")}
                                                      client="移动端"
                                                      type="学院党组织书记审批：批准"
                                                      content={<p>同意</p>}
                                                      hasQuote={true}
                                                    />
                                                  )}
                                                <MobileCommentCard
                                                  name={
                                                    getUserById(
                                                      template.value.counselor,
                                                    )?.name || "-"
                                                  }
                                                  avatar={(
                                                    getUserById(
                                                      template.value.counselor,
                                                    )?.name || "-"
                                                  ).slice(0, 1)}
                                                  avatarColor={
                                                    getUserById(
                                                      template.value.counselor,
                                                    )?.gender === "male"
                                                      ? "rgb(93, 156, 236)"
                                                      : "rgb(239, 139, 186)"
                                                  }
                                                  date={dayjs(
                                                    nextAuditCommit.value,
                                                  ).format("YYYY-MM-DD")}
                                                  time={dayjs(
                                                    nextAuditCommit.value,
                                                  ).format("HH:mm:ss")}
                                                  client="企业微信"
                                                  type="辅导员审批：批准"
                                                  content={<p>同意</p>}
                                                  hasQuote={true}
                                                />
                                                <MobileCommentCard
                                                  name={template.value.name}
                                                  avatar={template.value.name.slice(
                                                    0,
                                                    1,
                                                  )}
                                                  avatarColor="rgb(93, 156, 236)"
                                                  date={dayjs(
                                                    template.value.submitTime,
                                                  ).format("YYYY-MM-DD")}
                                                  time={dayjs(
                                                    template.value.submitTime,
                                                  ).format("HH:mm:ss")}
                                                  client="iphone"
                                                  type="提交：提交"
                                                  content={null}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div
                                class="wffp-dev-extend-area"
                                style="display: none;"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="ui-layout-footer footer-inner-col">
                        <div class="ui-layout-box mwffp-frame-bottom">
                          <div class="mwffp-bottom">
                            <div class="ui-layout-row">
                              <div class="ui-layout-col ui-layout-col-4">
                                <div class="mwffp-bottom-sign">
                                  <span class="ui-icon ui-icon-wrapper">
                                    <svg
                                      class="ui-icon-lg ui-icon-svg Icon-edit-o"
                                      fill="currentColor"
                                    >
                                      <use xlinkHref="#Icon-edit-o"></use>
                                    </svg>
                                  </span>
                                  <span>意见</span>
                                </div>
                              </div>
                              <div class="ui-layout-col ui-layout-col-4">
                                <div class="mwffp-bottom-more">
                                  <span class="ui-icon ui-icon-wrapper">
                                    <svg
                                      class="ui-icon-lg ui-icon-svg Icon-more"
                                      fill="currentColor"
                                    >
                                      <use xlinkHref="#Icon-more"></use>
                                    </svg>
                                  </span>
                                  <span>更多</span>
                                </div>
                              </div>
                              <div class="ui-layout-col ui-layout-col-16">
                                <div class="mwffp-bottom-btns mwffp-bottom-btns-2">
                                  <div>
                                    <button
                                      class="ui-m-btn ui-m-btn-primary ui-m-btn-middle"
                                      onClick={goBack}
                                    >
                                      批准
                                    </button>
                                  </div>
                                  <div>
                                    <button class="ui-m-btn ui-m-btn-default ui-m-btn-middle">
                                      保存
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    return () => <>{showType.value === "pc" ? renderPC() : renderMobile()}</>;
  },
});
