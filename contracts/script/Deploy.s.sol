// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {Socemon} from "../src/Socemon.sol";

/// Deploys Socemon and seeds every species from socemon.json in one addSpecies call.
/// Env: SOCEMON_MINTER (server wallet address), SOCEMON_BASE_URI (e.g. https://host/api/socemon/).
contract Deploy is Script {
    function run() external returns (Socemon socemon) {
        Socemon.SpeciesInit[] memory list = loadCatalog();
        vm.startBroadcast();
        socemon = new Socemon(msg.sender, vm.envString("SOCEMON_BASE_URI"));
        socemon.addSpecies(list);
        socemon.grantRole(socemon.MINTER_ROLE(), vm.envAddress("SOCEMON_MINTER"));
        vm.stopBroadcast();
    }

    function loadCatalog() public view returns (Socemon.SpeciesInit[] memory list) {
        string memory json = vm.readFile(string.concat(vm.projectRoot(), "/socemon.json"));
        uint256 n;
        while (vm.keyExistsJson(json, string.concat("$[", vm.toString(n), "]"))) n++;

        list = new Socemon.SpeciesInit[](n);
        for (uint256 i; i < n; i++) {
            string memory p = string.concat("$[", vm.toString(i), "]");
            list[i] = Socemon.SpeciesInit({
                id: vm.parseJsonUint(json, string.concat(p, ".id")),
                pool: uint8(vm.parseJsonUint(json, string.concat(p, ".pool"))),
                maxSupply: uint32(vm.parseJsonUint(json, string.concat(p, ".maxSupply"))),
                transferable: vm.parseJsonBool(json, string.concat(p, ".transferable"))
            });
        }
    }
}
