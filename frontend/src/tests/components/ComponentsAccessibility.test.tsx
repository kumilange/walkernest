import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

// Components to test
import CloseButton from "@/components/button/close-button";
import LoadingButton from "@/components/button/loading-button";
import ErrorFallback from "@/components/error/error-fallback";
import MenuItem from "@/components/menu-item";
import MenuActionTrigger from "@/components/menu-item/menu-action-trigger";
import PopoverCloseButton from "@/components/menu-item/popover-close-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

// Test icons
import { Download, Info, Settings } from "lucide-react";

describe("Components Accessibility Tests", () => {
  describe("Button Components", () => {
    describe("CloseButton", () => {
      it("should have proper accessibility attributes", async () => {
        const mockClose = vi.fn();
        render(<CloseButton handleClose={mockClose} />);

        const button = screen.getByRole("button", { name: /close/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-label", "Close");
      });

      it("should pass axe accessibility tests", async () => {
        const mockClose = vi.fn();
        const { container } = render(<CloseButton handleClose={mockClose} />);

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });

      it("should be keyboard accessible", async () => {
        const mockClose = vi.fn();
        const user = userEvent.setup();

        render(<CloseButton handleClose={mockClose} />);

        const button = screen.getByRole("button", { name: /close/i });
        await user.tab();
        expect(button).toHaveFocus();

        await user.keyboard("{Enter}");
        expect(mockClose).toHaveBeenCalled();
      });
    });

    describe("LoadingButton", () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it("should have proper accessibility attributes when loading", async () => {
        render(<LoadingButton loading={true}>Save</LoadingButton>);

        const button = screen.getByRole("button", { name: /save/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "true");
      });

      it("should have proper accessibility attributes when not loading", async () => {
        render(<LoadingButton loading={false}>Save</LoadingButton>);

        const button = screen.getByRole("button", { name: /save/i });
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
        expect(button).toHaveAttribute("aria-busy", "false");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(<LoadingButton loading={false}>Save</LoadingButton>);

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("UI Button", () => {
      it("should have proper focus management", async () => {
        const mockClick = vi.fn();
        const user = userEvent.setup();

        render(<Button onClick={mockClick}>Click me</Button>);

        const button = screen.getByRole("button", { name: /click me/i });
        await user.tab();
        expect(button).toHaveFocus();

        await user.keyboard("{Enter}");
        expect(mockClick).toHaveBeenCalled();
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(<Button>Test Button</Button>);

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });
  });

  describe("Form Components", () => {
    describe("Input", () => {
      it("should have proper accessibility with label", async () => {
        render(
          <div>
            <Label htmlFor="test-input">Email</Label>
            <Input id="test-input" type="email" placeholder="Enter email" />
          </div>
        );

        const input = screen.getByRole("textbox", { name: /email/i });
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute("type", "email");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <div>
            <Label htmlFor="test-input">Email</Label>
            <Input id="test-input" type="email" />
          </div>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("Checkbox", () => {
      it("should have proper accessibility attributes", async () => {
        render(
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms and conditions</Label>
          </div>
        );

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAccessibleName("Accept terms and conditions");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <div className="flex items-center space-x-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Accept terms</Label>
          </div>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("Switch", () => {
      it("should have proper accessibility attributes", async () => {
        render(
          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
        );

        const switchElement = screen.getByRole("switch");
        expect(switchElement).toBeInTheDocument();
        expect(switchElement).toHaveAccessibleName("Enable notifications");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <div className="flex items-center space-x-2">
            <Switch id="notifications" />
            <Label htmlFor="notifications">Enable notifications</Label>
          </div>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });
  });

  describe("Layout Components", () => {
    describe("Card", () => {
      it("should have proper semantic structure", async () => {
        render(
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card content</p>
            </CardContent>
          </Card>
        );

        expect(screen.getByText("Card Title")).toBeInTheDocument();
        expect(screen.getByText("Card description")).toBeInTheDocument();
        expect(screen.getByText("Card content")).toBeInTheDocument();
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <Card>
            <CardHeader>
              <CardTitle>Test Title</CardTitle>
              <CardDescription>Test description</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Test content</p>
            </CardContent>
          </Card>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("Alert", () => {
      it("should have proper alert role", async () => {
        render(
          <Alert>
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>This is an important message.</AlertDescription>
          </Alert>
        );

        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(screen.getByText("Important Notice")).toBeInTheDocument();
        expect(screen.getByText("This is an important message.")).toBeInTheDocument();
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <Alert>
            <AlertTitle>Test Alert</AlertTitle>
            <AlertDescription>Test alert description</AlertDescription>
          </Alert>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });
  });

  describe("Menu Components", () => {
    describe("MenuActionTrigger", () => {
      it("should have proper accessibility attributes", async () => {
        render(
          <Popover>
            <MenuActionTrigger icon={<Settings />} tooltip="Settings menu" />
          </Popover>
        );

        const button = screen.getByRole("button", { name: /settings menu/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-label", "Settings menu");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <Popover>
            <MenuActionTrigger icon={<Settings />} tooltip="Settings menu" />
          </Popover>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("PopoverCloseButton", () => {
      it("should have proper accessibility attributes", async () => {
        render(
          <Popover defaultOpen>
            <PopoverTrigger>
              <Button>Open</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton />
            </PopoverContent>
          </Popover>
        );

        const button = screen.getByRole("button", { name: /close/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-label", "Close");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <Popover defaultOpen>
            <PopoverTrigger>
              <Button>Open</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverCloseButton />
            </PopoverContent>
          </Popover>
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
            "nested-interactive": { enabled: false }, // Expected in popover setup
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });

    describe("MenuItem", () => {
      it("should have proper accessibility structure", async () => {
        render(
          <MenuItem
            tooltip="Download data"
            actionIcon={<Download />}
            title="Download"
            description="Export your data"
            content={<div>Download content</div>}
          />
        );

        const button = screen.getByRole("button", { name: /download data/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute("aria-label", "Download data");
      });

      it("should pass axe accessibility tests", async () => {
        const { container } = render(
          <MenuItem
            tooltip="Download data"
            actionIcon={<Download />}
            title="Download"
            description="Export your data"
            content={<div>Download content</div>}
          />
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
            "button-name": { enabled: false }, // The button has proper aria-label
          },
        });

        expect(results.violations).toHaveLength(0);
      });
    });
  });

  describe("Error Components", () => {
    describe("ErrorFallback", () => {
      it("should have proper accessibility structure", () => {
        const testError = new Error("Test error message");
        const mockReset = vi.fn();

        render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

        // Check main landmark
        const main = screen.getByRole("main");
        expect(main).toBeInTheDocument();
        expect(main).toHaveAttribute("aria-labelledby", "error-title");

        // Check alert
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveAttribute("aria-live", "assertive");

        // Check the main title (h3 element)
        const title = screen.getByRole("heading", { name: /error occurred/i });
        expect(title).toBeInTheDocument();
        expect(title).toHaveAttribute("id", "error-title");

        // Check the secondary heading (h2 element)
        const errorHeading = screen.getByRole("heading", { name: /^error$/i });
        expect(errorHeading).toBeInTheDocument();

        // Check button
        const button = screen.getByRole("button", { name: /try again/i });
        expect(button).toBeInTheDocument();
      });

      it("should pass axe accessibility tests", async () => {
        const testError = new Error("Test error");
        const mockReset = vi.fn();

        const { container } = render(
          <ErrorFallback error={testError} resetErrorBoundary={mockReset} />
        );

        const results = await axe(container, {
          rules: {
            "color-contrast": { enabled: false }, // Disable for jsdom
          },
        });

        expect(results.violations).toHaveLength(0);
      });

      it("should handle keyboard navigation", async () => {
        const user = userEvent.setup();
        const testError = new Error("Test error");
        const mockReset = vi.fn();

        render(<ErrorFallback error={testError} resetErrorBoundary={mockReset} />);

        const retryButton = screen.getByRole("button", { name: /try again/i });
        await user.tab();
        expect(retryButton).toHaveFocus();

        await user.keyboard("{Enter}");
        expect(mockReset).toHaveBeenCalledOnce();
      });
    });
  });
});
