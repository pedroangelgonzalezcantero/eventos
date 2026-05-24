package com.salon.eventos.service;

import com.salon.eventos.dto.MenuDto;
import com.salon.eventos.entity.Event;
import com.salon.eventos.entity.Menu;
import com.salon.eventos.repository.EventRepository;
import com.salon.eventos.repository.MenuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MenuService {

    @Autowired
    private MenuRepository menuRepository;

    @Autowired
    private EventRepository eventRepository;

    public List<MenuDto> getMenusByEvent(Long eventId) {
        return menuRepository.findByEventId(eventId).stream().map(this::toDto).collect(Collectors.toList());
    }

    public MenuDto createMenu(Long eventId, MenuDto dto) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        Menu menu = new Menu();
        menu.setEvent(event);
        fillMenu(menu, dto);
        return toDto(menuRepository.save(menu));
    }

    public MenuDto updateMenu(Long menuId, MenuDto dto) {
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new RuntimeException("Menú no encontrado"));
        fillMenu(menu, dto);
        return toDto(menuRepository.save(menu));
    }

    public void deleteMenu(Long menuId) {
        menuRepository.deleteById(menuId);
    }

    public void selectMenu(Long eventId, Long menuId) {
        // Deseleccionar todos
        menuRepository.findByEventId(eventId).forEach(m -> {
            m.setSelected(false);
            menuRepository.save(m);
        });
        // Seleccionar el elegido
        Menu menu = menuRepository.findById(menuId)
                .orElseThrow(() -> new RuntimeException("Menú no encontrado"));
        menu.setSelected(true);
        menuRepository.save(menu);
        // Marcar el evento como menú confirmado
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Evento no encontrado"));
        event.setMenuConfirmed(true);
        eventRepository.save(event);
    }

    private void fillMenu(Menu menu, MenuDto dto) {
        menu.setName(dto.getName());
        menu.setDescription(dto.getDescription());
        menu.setStarters(dto.getStarters());
        menu.setFirstCourse(dto.getFirstCourse());
        menu.setSecondCourse(dto.getSecondCourse());
        menu.setDessert(dto.getDessert());
        menu.setDrinks(dto.getDrinks());
        menu.setExtras(dto.getExtras());
        menu.setPricePerPerson(dto.getPricePerPerson());
        if (dto.getVariants() != null) menu.setVariants(dto.getVariants());
    }

    public MenuDto toDto(Menu m) {
        return MenuDto.builder()
                .id(m.getId())
                .eventId(m.getEvent().getId())
                .name(m.getName())
                .description(m.getDescription())
                .starters(m.getStarters())
                .firstCourse(m.getFirstCourse())
                .secondCourse(m.getSecondCourse())
                .dessert(m.getDessert())
                .drinks(m.getDrinks())
                .extras(m.getExtras())
                .pricePerPerson(m.getPricePerPerson())
                .selected(m.isSelected())
                .variants(m.getVariants())
                .build();
    }
}

