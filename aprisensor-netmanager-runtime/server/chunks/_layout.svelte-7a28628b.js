import { c as create_ssr_component, a as subscribe, e as escape, v as validate_component, d as each, f as null_to_empty } from './index-5affc850.js';
import { c as connectionStatus, B as Button, n as notifications } from './Button-d6898c4f.js';
import './index2-403db956.js';

const css$1 = {
  code: ".notifications.svelte-1ykrt2d{position:fixed;top:10px;left:0;right:0;margin:0 auto;padding:0;z-index:9999;display:flex;flex-direction:column;justify-content:flex-start;align-items:center;pointer-events:none}.toast.svelte-1ykrt2d{flex:0 0 auto;margin-bottom:10px}.content.svelte-1ykrt2d{padding:10px;display:block;color:white;font-weight:500}",
  map: null
};
const Toast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $notifications, $$unsubscribe_notifications;
  $$unsubscribe_notifications = subscribe(notifications, (value) => $notifications = value);
  let { themes = {
    danger: "#E26D69",
    success: "#84C991",
    warning: "#f0ad4e",
    info: "#5bc0de",
    default: "#aaaaaa"
  } } = $$props;
  if ($$props.themes === void 0 && $$bindings.themes && themes !== void 0)
    $$bindings.themes(themes);
  $$result.css.add(css$1);
  $$unsubscribe_notifications();
  return `<div class="${"notifications svelte-1ykrt2d"}">${each($notifications, (notification) => {
    return `<div class="${"toast svelte-1ykrt2d"}" style="${"background: " + escape(themes[notification.type], true) + ";"}"><div class="${"content svelte-1ykrt2d"}">${escape(notification.message)}</div>
            ${notification.icon ? `<i class="${escape(null_to_empty(notification.icon), true) + " svelte-1ykrt2d"}"></i>` : ``}
        </div>`;
  })}
</div>`;
});
const css = {
  code: "div#topmenu.svelte-qkcmna{position:fixed;top:0;z-index:10}",
  map: null
};
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $connectionStatus, $$unsubscribe_connectionStatus;
  $$unsubscribe_connectionStatus = subscribe(connectionStatus, (value) => $connectionStatus = value);
  let connectionStatusColor = "bg-green-400";
  $$result.css.add(css);
  {
    {
      if ($connectionStatus == "is-info") {
        connectionStatusColor = "bg-blue-400";
      } else if ($connectionStatus == "is-danger") {
        connectionStatusColor = "bg-red-400";
      } else if ($connectionStatus == "is-success") {
        connectionStatusColor = "bg-green-400";
      } else if ($connectionStatus == "is-busy") {
        connectionStatusColor = "bg-blue-300";
      }
    }
  }
  $$unsubscribe_connectionStatus();
  return `<div class="${"grid place-items-center h-full"}"><div id="${"topmenu"}" class="${"container inline-flex max-w-full " + escape(connectionStatusColor, true) + " grid grid-cols-6 gap-1 svelte-qkcmna"}"><div id="${"connectionstatusbutton"}" class="${"col-start-2 my-2"}">${validate_component(Button, "Button").$$render(
    $$result,
    {
      class: "connectionstatusbutton ",
      status: $connectionStatus,
      type: $connectionStatus,
      rounded: true
    },
    {},
    {
      default: () => {
        return `Sensorkit`;
      }
    }
  )}</div>
		<div id="${"rebootbutton"}" class="${"my-2"}">${validate_component(Button, "Button").$$render(
    $$result,
    {
      class: "rebootbutton",
      type: $connectionStatus,
      rounded: true
    },
    {},
    {
      default: () => {
        return `Reboot`;
      }
    }
  )}</div>
		<div id="${"shutdownbutton"}" class="${"my-2"}">${validate_component(Button, "Button").$$render(
    $$result,
    {
      class: "shutdownbutton",
      type: $connectionStatus,
      rounded: true
    },
    {},
    {
      default: () => {
        return `Shutdown`;
      }
    }
  )}</div>
		<div id="${"infobutton"}" class="${"my-2"}">${validate_component(Button, "Button").$$render(
    $$result,
    {
      class: "infobutton",
      type: $connectionStatus,
      rounded: true
    },
    {},
    {
      default: () => {
        return `Info`;
      }
    }
  )}</div></div>

	${validate_component(Toast, "Toast").$$render($$result, {}, {}, {})}

	${slots.default ? slots.default({}) : ``}
</div>`;
});

export { Layout as default };
//# sourceMappingURL=_layout.svelte-7a28628b.js.map
