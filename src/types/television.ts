import { Characteristic } from "../hap-types";
import { HapService, AccessoryTypeExecuteResponse } from "../interfaces";

export class Television {
  sync(service: HapService) {
    let map = new Map<string, string>();
    service.characteristics.forEach((c) => {
      if (c.type === Characteristic.InputSourceType) {
        map.set(c.iid.toString(), c.description);
        console.log(c.iid);
        console.log(c.description);
        console.log(c.value);
      }
    });
    const response = {
      id: service.uniqueId,
      type:
        service.accessoryInformation.Manufacturer === "Nintendo" // for homebridge-wiiu. TODO: xbox devices/playstation
          ? "action.devices.types.GAME_CONSOLE"
          : "action.devices.types.TV",
      traits: ["action.devices.traits.OnOff"],
      name: {
        defaultNames: [service.serviceName, service.accessoryInformation.Name],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: true,
      attributes: {
        availableInputs: [
          {
            // each of the variables need a respective:
            key: "key",
            name: "name",
          },
        ],
      },
      deviceInfo: {
        manufacturer: service.accessoryInformation.Manufacturer,
        model: service.accessoryInformation.Model,
      },
      customData: {
        aid: service.aid,
        iid: service.iid,
        instanceUsername: service.instance.username,
        instanceIpAddress: service.instance.ipAddress,
        instancePort: service.instance.port,
      },
    };
    return response;
  }

  query(service: HapService) {
    return {
      on: service.characteristics.find((x) => x.type === Characteristic.Active)
        .value
        ? true
        : false,
      online: true,
    };
  }

  execute(service: HapService, command): AccessoryTypeExecuteResponse {
    if (!command.execution.length) {
      return { payload: { characteristics: [] } };
    }

    switch (command.execution[0].command) {
      case "action.devices.commands.OnOff": {
        const payload = {
          characteristics: [
            {
              aid: service.aid,
              iid: service.characteristics.find(
                (x) => x.type === Characteristic.Active,
              ).iid,
              value: command.execution[0].params.on ? 1 : 0,
            },
          ],
        };
        return { payload };
      }
    }
  }
}
