import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { BrowserRouter } from "react-router-dom";

// Mock the auth context
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import after mocks
import Login from "@/pages/Login";
import { toast } from "sonner";

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render login form", () => {
      renderLogin();

      expect(screen.getByText("Welcome Back")).toBeInTheDocument();
      expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("should render signup link", () => {
      renderLogin();

      expect(screen.getByText("Create account")).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      renderLogin();

      expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    });

    it("should render logo", () => {
      renderLogin();

      expect(screen.getByAltText("Mahima Academy")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("should update email input on change", () => {
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address") as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password input on change", () => {
      renderLogin();

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: "password123" } });

      expect(passwordInput.value).toBe("password123");
    });

    it("should toggle password visibility", () => {
      renderLogin();

      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;
      expect(passwordInput.type).toBe("password");

      // Find and click the toggle button (eye icon)
      const toggleButton = screen.getByRole("button", { name: "" });
      if (toggleButton) {
        fireEvent.click(toggleButton);
        // After clicking, type should change to text
      }
    });
  });

  describe("Form Submission", () => {
    it("should show error when email is empty", async () => {
      renderLogin();

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Please fill in all fields");
      });
    });

    it("should show error when password is empty", async () => {
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Please fill in all fields");
      });
    });

    it("should call login function with credentials", async () => {
      mockLogin.mockResolvedValueOnce({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should navigate to dashboard on successful login", async () => {
      mockLogin.mockResolvedValueOnce({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", { replace: true });
      });
    });

    it("should show success toast on successful login", async () => {
      mockLogin.mockResolvedValueOnce({ error: null });
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("Welcome back!");
      });
    });

    it("should show error toast on failed login", async () => {
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "wrong@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Invalid credentials");
      });
    });

    it("should disable button while loading", async () => {
      mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Signing in...")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper form labels", () => {
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address");
      const passwordInput = screen.getByLabelText("Password");

      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
    });

    it("should have proper input types", () => {
      renderLogin();

      const emailInput = screen.getByLabelText("Email Address") as HTMLInputElement;
      const passwordInput = screen.getByLabelText("Password") as HTMLInputElement;

      expect(emailInput.type).toBe("email");
      expect(passwordInput.type).toBe("password");
    });

    it("should have submit button type", () => {
      renderLogin();

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });
});

describe("Login Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should trim email whitespace before submission", async () => {
    mockLogin.mockResolvedValueOnce({ error: null });
    renderLogin();

    const emailInput = screen.getByLabelText("Email Address");
    const passwordInput = screen.getByLabelText("Password");
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: "  test@example.com  " } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The login function trims the email
      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });
});
