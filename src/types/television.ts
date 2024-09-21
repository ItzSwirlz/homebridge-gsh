import { Characteristic, Service } from "../hap-types";
import { HapService, AccessoryTypeExecuteResponse } from "../interfaces";

export class Television {
  private map: Map<string, string>;

  sync(service: HapService) {
    this.map = new Map<string, string>();
    service.accessory.services.forEach((inputservice) => {
      if (inputservice.type === Service.InputSource) {
        this.map.set(
          inputservice.characteristics.find(
            (x) => x.type === Characteristic.Identifier,
          ).value,
          inputservice.characteristics.find(
            (x) => x.type === Characteristic.ConfiguredName,
          ).value,
        );
      }
    });
    const response = {
      id: service.uniqueId,
      type:
        service.accessoryInformation.Manufacturer === "Nintendo" // for homebridge-wiiu. TODO: xbox devices/playstation
          ? "action.devices.types.GAME_CONSOLE"
          : "action.devices.types.TV",
      traits: [
        "action.devices.traits.OnOff",
        "action.devices.traits.InputSelector",
      ],
      name: {
        defaultNames: [service.serviceName, service.accessoryInformation.Name],
        name: service.serviceName,
        nicknames: [],
      },
      willReportState: true,
      attributes: {
        availableInputs: [],
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
    this.map.forEach((k, v) => {
      response.attributes.availableInputs =
        response.attributes.availableInputs.concat([
          {
            key: k,
            names: [
              {
                lang: "en",
                name_synonym: [v],
              },
            ],
          },
        ]);
    });
    return response;
  }

  query(service: HapService) {
    const currentInputValue = service.characteristics.find(
      (x) => x.type === Characteristic.ActiveIdentifier,
    ).value;
    const currInput = this.map.get(currentInputValue);
    return {
      on: service.characteristics.find((x) => x.type === Characteristic.Active)
        .value
        ? true
        : false,
      online: true,
      currentInput: currInput,
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
      case "action.devices.commands.SetInput": {
        const payload = {
          characteristics: [
            {
              aid: service.aid,
              iid: service.characteristics.find(
                (x) => x.type === Characteristic.ActiveIdentifier,
              ).iid,
              value: command.execution[0].params.newInput,
            },
          ],
        };
        return { payload };
      }
    }
  }
}
