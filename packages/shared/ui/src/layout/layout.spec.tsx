import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

import {
  DashShell,
  DashHeader,
  DashHeaderBrand,
  DashHeaderNav,
  DashHeaderNavItem,
  DashHeaderActions,
  DashSidebar,
  DashSidebarHeader,
  DashSidebarNav,
  DashSidebarItem,
  DashSidebarBadge,
  DashSidebarFooter,
  DashFooter,
  DashFooterLeft,
  DashFooterRight,
  DashBreadcrumb,
  DashBreadcrumbItem,
  DashBreadcrumbSeparator,
  PublicLayout,
  PublicLayoutMain,
  PublicHeader,
  PublicHeaderBrand,
  PublicHeaderNav,
  PublicHeaderNavItem,
  PublicHeaderActions,
  PublicFooter,
  PublicFooterBrand,
  PublicFooterSection,
  PublicFooterLink,
  PublicFooterBottom,
  PublicTopBanner,
  PublicTopBannerBadge,
  PublicTopBannerText,
  PublicTopBannerAction,
} from "./index"

describe("dashx1 Layout Components", () => {
  it("renders DashShell with children, sidebar, header, and footer", () => {
    render(
      <MemoryRouter>
        <DashShell
          header={<div data-testid="dash-header">Custom Header</div>}
          sidebar={<div data-testid="dash-sidebar">Custom Sidebar</div>}
          footer={<div data-testid="dash-footer">Custom Footer</div>}
        >
          <div data-testid="dash-child">Main Shell Child</div>
        </DashShell>
      </MemoryRouter>
    )

    expect(screen.getByTestId("dash-header").textContent).toBe("Custom Header")
    expect(screen.getByTestId("dash-sidebar").textContent).toBe("Custom Sidebar")
    expect(screen.getByTestId("dash-footer").textContent).toBe("Custom Footer")
    expect(screen.getByTestId("dash-child").textContent).toBe("Main Shell Child")
  })

  it("renders DashHeader compound subcomponents with custom children", () => {
    render(
      <MemoryRouter>
        <DashHeader>
          <DashHeaderBrand>
            <span>My Brand Child</span>
          </DashHeaderBrand>
          <DashHeaderNav>
            <DashHeaderNavItem to="/item1">Nav Item 1 Child</DashHeaderNavItem>
          </DashHeaderNav>
          <DashHeaderActions>
            <button>Action Button Child</button>
          </DashHeaderActions>
        </DashHeader>
      </MemoryRouter>
    )

    expect(screen.getByText("My Brand Child")).toBeTruthy()
    expect(screen.getByText("Nav Item 1 Child")).toBeTruthy()
    expect(screen.getByText("Action Button Child")).toBeTruthy()
  })

  it("renders DashSidebar compound subcomponents with custom children", () => {
    render(
      <MemoryRouter>
        <DashSidebar>
          <DashSidebarHeader>Sidebar Header Child</DashSidebarHeader>
          <DashSidebarNav>
            <DashSidebarItem to="/dash">
              <span>Item Child</span>
              <DashSidebarBadge>Badge Child</DashSidebarBadge>
            </DashSidebarItem>
          </DashSidebarNav>
          <DashSidebarFooter>Footer Child</DashSidebarFooter>
        </DashSidebar>
      </MemoryRouter>
    )

    expect(screen.getByText("Sidebar Header Child")).toBeTruthy()
    expect(screen.getByText("Item Child")).toBeTruthy()
    expect(screen.getByText("Badge Child")).toBeTruthy()
    expect(screen.getByText("Footer Child")).toBeTruthy()
  })

  it("handles hoverOpen prop in DashSidebar dynamically on hover", () => {
    const { container } = render(
      <MemoryRouter>
        <DashSidebar hoverOpen={true} data-testid="test-sidebar">
          <div>Content</div>
        </DashSidebar>
      </MemoryRouter>
    )

    const aside = container.querySelector("aside")!
    expect(aside).toBeTruthy()
    // Saat belum dihover: sidebar dalam kondisi collapsed (mini)
    expect(aside.getAttribute("data-collapsed")).toBe("true")
    expect(aside.className).toContain("w-[72px]")

    // Hover mouse enter -> sidebar MEMBUKA (isCollapsed = false)
    fireEvent.mouseEnter(aside)
    expect(aside.getAttribute("data-collapsed")).toBe("false")
    expect(aside.className).not.toContain("w-[72px]")

    // Hover mouse leave -> kembali collapsed (mini)
    fireEvent.mouseLeave(aside)
    expect(aside.getAttribute("data-collapsed")).toBe("true")
    expect(aside.className).toContain("w-[72px]")
  })

  it("renders DashFooter and DashBreadcrumb with children", () => {
    render(
      <MemoryRouter>
        <DashBreadcrumb>
          <DashBreadcrumbItem href="/">Home</DashBreadcrumbItem>
          <DashBreadcrumbSeparator>/</DashBreadcrumbSeparator>
          <DashBreadcrumbItem active>Analytics</DashBreadcrumbItem>
        </DashBreadcrumb>

        <DashFooter>
          <DashFooterLeft>Left Footer Child</DashFooterLeft>
          <DashFooterRight>Right Footer Child</DashFooterRight>
        </DashFooter>
      </MemoryRouter>
    )

    expect(screen.getByText("Home")).toBeTruthy()
    expect(screen.getByText("Analytics")).toBeTruthy()
    expect(screen.getByText("Left Footer Child")).toBeTruthy()
    expect(screen.getByText("Right Footer Child")).toBeTruthy()
  })
})

describe("publicx1 Layout Components", () => {
  it("renders PublicLayout with children and top banner", () => {
    render(
      <MemoryRouter>
        <PublicLayout
          banner={
            <PublicTopBanner>
              <PublicTopBannerBadge>Special</PublicTopBannerBadge>
              <PublicTopBannerText>Discount 50% Off</PublicTopBannerText>
              <PublicTopBannerAction href="#deal">Grab Now</PublicTopBannerAction>
            </PublicTopBanner>
          }
        >
          <PublicLayoutMain>
            <h1>Public Content Child</h1>
          </PublicLayoutMain>
        </PublicLayout>
      </MemoryRouter>
    )

    expect(screen.getByText("Special")).toBeTruthy()
    expect(screen.getByText("Discount 50% Off")).toBeTruthy()
    expect(screen.getByText("Grab Now")).toBeTruthy()
    expect(screen.getByRole("heading", { name: /Public Content Child/i })).toBeTruthy()
  })

  it("renders PublicHeader and PublicFooter subcomponents with children", () => {
    render(
      <MemoryRouter>
        <PublicHeader>
          <PublicHeaderBrand>Custom Public Brand Child</PublicHeaderBrand>
          <PublicHeaderNav>
            <PublicHeaderNavItem href="#features">Features Link</PublicHeaderNavItem>
          </PublicHeaderNav>
          <PublicHeaderActions>
            <button>Custom Action</button>
          </PublicHeaderActions>
        </PublicHeader>

        <PublicFooter>
          <PublicFooterBrand name="Custom Footer Brand" />
          <PublicFooterSection title="Custom Section">
            <PublicFooterLink href="#link1">Custom Link 1</PublicFooterLink>
          </PublicFooterSection>
          <PublicFooterBottom copyright="© 2026 Test Corp" />
        </PublicFooter>
      </MemoryRouter>
    )

    expect(screen.getByText("Custom Public Brand Child")).toBeTruthy()
    expect(screen.getByText("Features Link")).toBeTruthy()
    expect(screen.getByText("Custom Action")).toBeTruthy()
    expect(screen.getByText("Custom Footer Brand")).toBeTruthy()
    expect(screen.getByText("Custom Section")).toBeTruthy()
    expect(screen.getByText("Custom Link 1")).toBeTruthy()
    expect(screen.getByText("© 2026 Test Corp")).toBeTruthy()
  })
})
