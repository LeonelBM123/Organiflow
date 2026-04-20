package com.sw.organiflow.modules.collaboration.dto;

public record CursorPayload(
        Double x,
        Double y,
        String selectedNodeId
) {}
