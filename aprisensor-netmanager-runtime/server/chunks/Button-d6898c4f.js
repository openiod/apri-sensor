import { d as derived, w as writable } from './index2-403db956.js';
import { c as create_ssr_component, g as compute_rest_props, h as add_attribute, e as escape } from './index-5affc850.js';

const connectionStatus = writable("is-busy");
function createNotificationStore(timeout) {
  const _notifications = writable([]);
  function send(message, type = "default", timeout2) {
    _notifications.update((state) => {
      return [...state, { id: id(), type, message, timeout: timeout2 }];
    });
  }
  const notifications2 = derived(_notifications, ($_notifications, set) => {
    set($_notifications);
    if ($_notifications.length > 0) {
      const timer = setTimeout(() => {
        _notifications.update((state) => {
          state.shift();
          return state;
        });
      }, $_notifications[0].timeout);
      return () => {
        clearTimeout(timer);
      };
    }
  });
  const { subscribe } = notifications2;
  return {
    subscribe,
    send,
    default: (msg, timeout2) => send(msg, "default", timeout2),
    danger: (msg, timeout2) => send(msg, "danger", timeout2),
    warning: (msg, timeout2) => send(msg, "warning", timeout2),
    info: (msg, timeout2) => send(msg, "info", timeout2),
    success: (msg, timeout2) => send(msg, "success", timeout2)
  };
}
function id() {
  return "_" + Math.random().toString(36).substr(2, 9);
}
const notifications = createNotificationStore();
let buttonColor = "bg-white";
const Button = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$restProps = compute_rest_props($$props, ["buttonStatus", "isRefreshingConnections"]);
  ({ class: [$$restProps.class] });
  let { buttonStatus = "is-info" } = $$props;
  let { isRefreshingConnections = false } = $$props;
  if ($$props.buttonStatus === void 0 && $$bindings.buttonStatus && buttonStatus !== void 0)
    $$bindings.buttonStatus(buttonStatus);
  if ($$props.isRefreshingConnections === void 0 && $$bindings.isRefreshingConnections && isRefreshingConnections !== void 0)
    $$bindings.isRefreshingConnections(isRefreshingConnections);
  return `




<button type="${"button"}" data-tooltip-target="${"tooltip-default"}"${add_attribute("status", buttonStatus, 0)} class="${"mt-3 ml-0 inline-flex w-full justify-center rounded-md border border-gray-300 " + escape(buttonColor, true) + " px-1 py-1 mx-1 my-1 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"}">
	
	${slots.default ? slots.default({}) : ``}</button>
<div id="${"tooltip-default"}" role="${"tooltip"}" class="${"inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700"}">Tooltip content
	<div class="${"tooltip-arrow"}" data-popper-arrow></div></div>


`;
});

export { Button as B, connectionStatus as c, notifications as n };
//# sourceMappingURL=Button-d6898c4f.js.map
