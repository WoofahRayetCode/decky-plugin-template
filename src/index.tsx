import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  staticClasses,
  ToggleField,
  Field
} from "@decky/ui";
import {
  callable,
  definePlugin,
  toaster,
} from "@decky/api"
import { useState, useEffect } from "react";
import { FaNetworkWired } from "react-icons/fa";

// Python backend function calls
const getCurrentTtl = callable<[], number>("get_current_ttl");
const setTtlTo65 = callable<[], boolean>("set_ttl_to_65");
const resetTtlToDefault = callable<[], boolean>("reset_ttl_to_default");
const makeTtlPersistent = callable<[ttl_value: number], boolean>("make_ttl_persistent");

function Content() {
  const [currentTtl, setCurrentTtl] = useState<number>(-1);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isPersistent, setIsPersistent] = useState<boolean>(false);

  // Load current TTL on component mount
  useEffect(() => {
    loadCurrentTtl();
  }, []);

  const loadCurrentTtl = async () => {
    try {
      const ttl = await getCurrentTtl();
      setCurrentTtl(ttl);
    } catch (error) {
      console.error("Failed to get current TTL:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to get current TTL value"
      });
    }
  };

  const handleSetTtl65 = async () => {
    setIsChanging(true);
    try {
      const success = await setTtlTo65();
      if (success) {
        setCurrentTtl(65);
        toaster.toast({
          title: "Success",
          body: "TTL changed to 65 successfully!"
        });
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to change TTL to 65"
        });
      }
    } catch (error) {
      console.error("Failed to set TTL to 65:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to change TTL to 65"
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handleResetTtl = async () => {
    setIsChanging(true);
    try {
      const success = await resetTtlToDefault();
      if (success) {
        setCurrentTtl(64);
        toaster.toast({
          title: "Success",
          body: "TTL reset to default (64) successfully!"
        });
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to reset TTL to default"
        });
      }
    } catch (error) {
      console.error("Failed to reset TTL:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to reset TTL to default"
      });
    } finally {
      setIsChanging(false);
    }
  };

  const handlePersistentToggle = async (enabled: boolean) => {
    try {
      const ttlValue = enabled ? 65 : 64;
      const success = await makeTtlPersistent(ttlValue);
      if (success) {
        setIsPersistent(enabled);
        toaster.toast({
          title: "Success",
          body: `TTL persistence ${enabled ? 'enabled' : 'disabled'} successfully!`
        });
      } else {
        toaster.toast({
          title: "Error",
          body: "Failed to change TTL persistence setting"
        });
      }
    } catch (error) {
      console.error("Failed to toggle persistence:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to change TTL persistence setting"
      });
    }
  };

  const getTtlStatusColor = () => {
    if (currentTtl === 65) return "#00ff00"; // Green
    if (currentTtl === 64) return "#ffff00"; // Yellow
    return "#ff0000"; // Red for error or unknown
  };

  return (
    <PanelSection title="TTL Changer">
      <PanelSectionRow>
        <Field
          label="Current TTL"
          description="Current system Time To Live value"
        >
          <div style={{ 
            color: getTtlStatusColor(), 
            fontWeight: "bold", 
            fontSize: "18px" 
          }}>
            {currentTtl === -1 ? "Loading..." : currentTtl}
          </div>
        </Field>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={loadCurrentTtl}
          disabled={isChanging}
        >
          Refresh TTL
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={handleSetTtl65}
          disabled={isChanging || currentTtl === 65}
        >
          {isChanging ? "Changing..." : "Set TTL to 65"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={handleResetTtl}
          disabled={isChanging || currentTtl === 64}
        >
          {isChanging ? "Changing..." : "Reset TTL to Default (64)"}
        </ButtonItem>
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Make Changes Persistent"
          description="Persist TTL changes across reboots"
          checked={isPersistent}
          onChange={handlePersistentToggle}
          disabled={isChanging}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <Field
          label="About TTL"
          description="TTL (Time To Live) determines how many hops a packet can make before being discarded. Some networks require TTL=65 for proper connectivity."
        />
      </PanelSectionRow>
    </PanelSection>
  );
}

export default definePlugin(() => {
  console.log("TTL Changer plugin initializing...");

  return {
    // The name shown in various decky menus
    name: "TTL Changer",
    // The element displayed at the top of your plugin's menu
    titleView: <div className={staticClasses.Title}>TTL Changer</div>,
    // The content of your plugin's menu
    content: <Content />,
    // The icon displayed in the plugin list
    icon: <FaNetworkWired />,
    // The function triggered when your plugin unloads
    onDismount() {
      console.log("TTL Changer plugin unloading...");
    },
  };
});
