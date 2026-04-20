package com.sw.organiflow.modules.collaboration.dto;

public record CursorMoveRequest(
        Double x,
        Double y,
        String selectedNodeId
) {}
