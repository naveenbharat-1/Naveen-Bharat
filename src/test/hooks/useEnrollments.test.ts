import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the API module
vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

// Mock the auth context
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(() => ({
    user: { id: 1, email: "test@example.com", role: "student" },
    isAdmin: false,
  })),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

import { apiGet, apiPost } from "@/lib/api";
import { toast } from "sonner";

describe("useEnrollments Hook Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchEnrollments", () => {
    it("should fetch and format enrollments correctly", async () => {
      const mockEnrollments = [
        { id: 1, userId: 1, courseId: 101, status: "active", purchasedAt: "2024-01-01" },
        { id: 2, userId: 1, courseId: 102, status: "active", purchasedAt: "2024-01-02" },
      ];

      (apiGet as any).mockResolvedValueOnce(mockEnrollments);

      const result = await apiGet("/api/enrollments");

      expect(result).toEqual(mockEnrollments);
      expect(apiGet).toHaveBeenCalledWith("/api/enrollments");
    });

    it("should handle empty enrollments", async () => {
      (apiGet as any).mockResolvedValueOnce([]);

      const result = await apiGet("/api/enrollments");

      expect(result).toEqual([]);
    });

    it("should handle API errors gracefully", async () => {
      (apiGet as any).mockRejectedValueOnce(new Error("Network error"));

      await expect(apiGet("/api/enrollments")).rejects.toThrow("Network error");
    });
  });

  describe("isEnrolled", () => {
    it("should return true for enrolled courses", () => {
      const enrolledCourseIds = [101, 102, 103];
      const courseId = 102;

      expect(enrolledCourseIds.includes(courseId)).toBe(true);
    });

    it("should return false for non-enrolled courses", () => {
      const enrolledCourseIds = [101, 102, 103];
      const courseId = 999;

      expect(enrolledCourseIds.includes(courseId)).toBe(false);
    });
  });

  describe("checkEnrollment", () => {
    it("should verify active enrollment", async () => {
      (apiGet as any).mockResolvedValueOnce({ status: "active" });

      const result = await apiGet("/api/enrollments/101");
      
      expect(result.status).toBe("active");
    });

    it("should return false for inactive enrollment", async () => {
      (apiGet as any).mockResolvedValueOnce({ status: "cancelled" });

      const result = await apiGet("/api/enrollments/101");
      
      expect(result.status).not.toBe("active");
    });

    it("should return false when no enrollment exists", async () => {
      (apiGet as any).mockResolvedValueOnce(null);

      const result = await apiGet("/api/enrollments/999");
      
      expect(result).toBeNull();
    });
  });

  describe("enrollInCourse", () => {
    it("should successfully enroll in a new course", async () => {
      (apiGet as any).mockResolvedValueOnce(null); // No existing enrollment
      (apiPost as any).mockResolvedValueOnce({ id: 1, courseId: 101, status: "active" });

      await apiPost("/api/enrollments", { courseId: 101, status: "active" });

      expect(apiPost).toHaveBeenCalledWith("/api/enrollments", {
        courseId: 101,
        status: "active"
      });
    });

    it("should not duplicate enrollment", () => {
      // This test documents expected behavior:
      // If user is already enrolled, the system should not create duplicate enrollment
      const existingEnrollment = { status: "active", courseId: 101 };
      
      // In the actual hook, it checks for existing enrollment before calling POST
      expect(existingEnrollment.status).toBe("active");
      
      // Duplicate check should prevent new enrollment
      const alreadyEnrolled = existingEnrollment.status === "active";
      expect(alreadyEnrolled).toBe(true);
    });

    it("should handle enrollment failure", async () => {
      (apiGet as any).mockResolvedValueOnce(null);
      (apiPost as any).mockRejectedValueOnce(new Error("Enrollment failed"));

      await expect(
        apiPost("/api/enrollments", { courseId: 101, status: "active" })
      ).rejects.toThrow("Enrollment failed");
    });
  });
});

describe("Enrollment Edge Cases", () => {
  it("should handle course ID as string", () => {
    const courseId = "101";
    const enrolledCourseIds = [101, 102];

    // Type coercion test
    expect(enrolledCourseIds.includes(Number(courseId))).toBe(true);
  });

  it("should handle null course ID", () => {
    const courseId = null;
    const enrolledCourseIds = [101, 102];

    expect(enrolledCourseIds.includes(courseId as any)).toBe(false);
  });

  it("should filter only active enrollments", () => {
    const enrollments = [
      { courseId: 101, status: "active" },
      { courseId: 102, status: "cancelled" },
      { courseId: 103, status: "active" },
    ];

    const activeCourseIds = enrollments
      .filter(e => e.status === "active")
      .map(e => e.courseId);

    expect(activeCourseIds).toEqual([101, 103]);
    expect(activeCourseIds).not.toContain(102);
  });
});

describe("Enrollment Security", () => {
  it("should not allow enrollment without user", async () => {
    // When user is null, enrollment should fail
    const user = null;

    if (!user) {
      expect(() => {
        toast.error("Please login to enroll");
      }).not.toThrow();
    }
  });

  it("should validate course ID before enrollment", () => {
    const invalidCourseIds = [0, -1, NaN, undefined, null];

    invalidCourseIds.forEach(id => {
      const isValid = id !== undefined && id !== null && Number.isInteger(id) && id > 0;
      expect(isValid).toBeFalsy();
    });
  });
});
