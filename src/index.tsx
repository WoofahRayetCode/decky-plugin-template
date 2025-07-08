import {
  ButtonItem,
  PanelSection,
  PanelSectionRow,
  staticClasses,
  ToggleField,
  Field,
  TextField
} from "@decky/ui";
import {
  callable,
  definePlugin,
  toaster,
} from "@decky/api"
import { useState, useEffect } from "react";
import { FaNetworkWired } from "react-icons/fa";
import "./styles.css";

// Python backend function calls
const getCurrentTtl = callable<[], number>("get_current_ttl");
const setTtlTo65 = callable<[], boolean>("set_ttl_to_65");
const resetTtlToDefault = callable<[], boolean>("reset_ttl_to_default");
const makeTtlPersistent = callable<[ttl_value: number], boolean>("make_ttl_persistent");
const getPersistentTtl = callable<[], {is_persistent: boolean, ttl_value: number | null}>("get_persistent_ttl");
const setTtlCustom = callable<[ttl_value: number], boolean>("set_ttl_custom");

function Content() {
  const [currentTtl, setCurrentTtl] = useState<number>(-1);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isPersistent, setIsPersistent] = useState<boolean>(false);
  const [persistentTtlValue, setPersistentTtlValue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customTtlValue, setCustomTtlValue] = useState<string>("65");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Load current TTL and persistence status on component mount
  useEffect(() => {
    loadTtlStatus();
  }, []);

  const loadTtlStatus = async () => {
    setIsLoading(true);
    try {
      const [ttl, persistenceInfo] = await Promise.all([
        getCurrentTtl(),
        getPersistentTtl()
      ]);
      
      setCurrentTtl(ttl);
      setIsPersistent(persistenceInfo.is_persistent);
      setPersistentTtlValue(persistenceInfo.ttl_value);
    } catch (error) {
      console.error("Failed to load TTL status:", error);
      toaster.toast({
        title: "Error",
        body: "Failed to load TTL status"
      });
    } finally {
      setIsLoading(false);
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
      const ttlValue = enabled ? currentTtl : 64;
      const success = await makeTtlPersistent(ttlValue);
      if (success) {
        setIsPersistent(enabled);
        setPersistentTtlValue(enabled ? ttlValue : null);
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

  const handleSetCustomTtl = async () => {
    const ttlValue = parseInt(customTtlValue);
    // Restrict to common Steam Deck values for simplicity
    if (isNaN(ttlValue) || ttlValue < 32 || ttlValue > 128) {
      toaster.toast({
        title: "Error",
        body: "TTL must be between 32 and 128 for Steam Deck compatibility"
      });
      return;
    }

    setIsChanging(true);
    try {
      const success = await setTtlCustom(ttlValue);
      if (success) {
        setCurrentTtl(ttlValue);
        toaster.toast({
          title: "Success",
          body: `TTL changed to ${ttlValue} successfully!`
        });
      } else {
        toaster.toast({
          title: "Error",
          body: `Failed to change TTL to ${ttlValue}`
        });
      }
    } catch (error) {
      console.error("Failed to set custom TTL:", error);
      toaster.toast({
        title: "Error",
        body: `Failed to change TTL to ${ttlValue}`
      });
    } finally {
      setIsChanging(false);
    }
  };

  const getTtlStatusClass = () => {
    if (isLoading) return "ttl-status ttl-loading";
    if (currentTtl === 65) return "ttl-status ttl-65";
    if (currentTtl === 64) return "ttl-status ttl-64";
    return "ttl-status ttl-error";
  };

  const getTtlDisplayValue = () => {
    if (isLoading) return "Loading...";
    if (currentTtl === -1) return "Error";
    return currentTtl.toString();
  };

  const getPersistenceInfo = () => {
    if (!isPersistent) return null;
    return (
      <div className="persistence-info">
        Persistent: {persistentTtlValue || "Unknown"}
      </div>
    );
  };

  return (
    <PanelSection title="TTL Changer">
      <PanelSectionRow>
        <Field
          label="Current TTL"
          description="Current system Time To Live value"
        >
          <div className={getTtlStatusClass()}>
            {getTtlDisplayValue()}
          </div>
          {getPersistenceInfo()}
        </Field>
      </PanelSectionRow>

      <PanelSectionRow>
        <ButtonItem
          layout="below"
          onClick={loadTtlStatus}
          disabled={isChanging}
        >
          {isChanging ? "Refreshing..." : "Refresh Status"}
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
        <ToggleField
          label="Advanced Mode"
          description="Show custom TTL options"
          checked={showAdvanced}
          onChange={setShowAdvanced}
          disabled={isChanging}
        />
      </PanelSectionRow>

      {showAdvanced && (
        <>
          <PanelSectionRow>
            <Field
              label="Custom TTL"
              description="Set a custom TTL value (32-128)"
            >
              <TextField
                value={customTtlValue}
                onChange={(e) => setCustomTtlValue(e.target.value)}
                disabled={isChanging}
              />
            </Field>
          </PanelSectionRow>

          <PanelSectionRow>
            <ButtonItem
              layout="below"
              onClick={handleSetCustomTtl}
              disabled={isChanging}
            >
              {isChanging ? "Setting..." : "Set Custom TTL"}
            </ButtonItem>
          </PanelSectionRow>
        </>
      )}

      <PanelSectionRow>
        <Field
          label="About TTL"
          description="TTL 65 is commonly needed for mobile hotspot tethering on Steam Deck. Default system TTL is 64."
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
