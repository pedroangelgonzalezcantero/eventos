package com.salon.eventos.controller;

import com.salon.eventos.dto.MenuDto;
import com.salon.eventos.service.MenuService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}/menus")
public class MenuController {

    @Autowired
    private MenuService menuService;

    @GetMapping
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('MENUS_VIEW')")
    public ResponseEntity<List<MenuDto>> getMenus(@PathVariable Long eventId) {
        return ResponseEntity.ok(menuService.getMenusByEvent(eventId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MENUS_EDIT')")
    public ResponseEntity<MenuDto> createMenu(@PathVariable Long eventId,
                                               @RequestBody MenuDto dto) {
        return ResponseEntity.ok(menuService.createMenu(eventId, dto));
    }

    @PutMapping("/{menuId}")
    @PreAuthorize("hasAuthority('MENUS_EDIT')")
    public ResponseEntity<MenuDto> updateMenu(@PathVariable Long eventId,
                                               @PathVariable Long menuId,
                                               @RequestBody MenuDto dto) {
        return ResponseEntity.ok(menuService.updateMenu(menuId, dto));
    }

    @DeleteMapping("/{menuId}")
    @PreAuthorize("hasAuthority('MENUS_EDIT')")
    public ResponseEntity<Void> deleteMenu(@PathVariable Long eventId,
                                            @PathVariable Long menuId) {
        menuService.deleteMenu(menuId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{menuId}/select")
    @PreAuthorize("hasRole('CLIENT') or hasAuthority('MENUS_EDIT')")
    public ResponseEntity<Void> selectMenu(@PathVariable Long eventId,
                                            @PathVariable Long menuId) {
        menuService.selectMenu(eventId, menuId);
        return ResponseEntity.ok().build();
    }
}
