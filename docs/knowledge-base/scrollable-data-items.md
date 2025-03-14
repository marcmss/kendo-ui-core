---
title: Scroll Selected MultiSelect Items
page_title: Scroll Selected MultiSelect Items
description: "Learn how to create scrollable data items in the Kendo UI MultiSelect component."
previous_url: /controls/editors/multiselect/how-to/scrollbale-data-items, /web/multiselect/how-to/scrollbale-data-items, /controls/editors/multiselect/how-to/scrollable-data-items, /controls/editors/multiselect/how-to/selection/scrollable-data-items
slug: howto_create_scrollable_data_items_multiselect
tags: telerik, kendo, jquery, multiselect, scroll, selected, items
component: multiselect
type: how-to
res_type: kb
---

## Environment

<table>
 <tr>
  <td>Product</td>
  <td>Progress® Kendo UI® MultiSelect for jQuery</td>
 </tr>
 <tr>
  <td>Operating System</td>
  <td>Windows 10 64bit</td>
 </tr>
 <tr>
  <td>Visual Studio Version</td>
  <td>Visual Studio 2017</td>
 </tr>
 <tr>
  <td>Preferred Language</td>
  <td>JavaScript</td>
 </tr>
</table>

## Description

How can I create a scrollable list of the selected items in a Kendo UI MultiSelect widget?

## Solution

The following example demonstrates how to achieve the desired scenario.

```dojo
<div id="example">
    <style>
      .myClass .k-multiselect-wrap
      {
        /* enable scrollability */
        overflow: auto;
        /* control selected items' container - use height or min-height and/or max-height */
        max-height: 100px;
      }

      .myClass .k-multiselect-wrap .k-button {
        /* force each selected item on a new line, if required */
        clear: left;
      }
    </style>

    <select id="required" multiple="multiple" data-placeholder="Select attendees..." style="width:200px">
        <option selected>Steven White</option>
        <option selected>Nancy King</option>
        <option selected>Nancy Davolio</option>
        <option selected>Robert Davolio</option>
        <option selected>Michael Leverling</option>
        <option selected>Andrew Callahan</option>
        <option selected>Michael Suyama</option>
        <option selected>Anne King</option>
        <option>Laura Peacock</option>
        <option>Robert Fuller</option>
        <option>Janet White</option>
        <option>Nancy Leverling</option>
        <option>Robert Buchanan</option>
        <option>Margaret Buchanan</option>
        <option selected>Andrew Fuller</option>
        <option>Anne Davolio</option>
        <option>Andrew Suyama</option>
        <option>Nige Buchanan</option>
        <option>Laura Fuller</option>
    </select>
</div>

<script>
  $("#required").kendoMultiSelect({
    select: onSelect
  });

  // set the custom class that applies all custom styling related to heights, scrollability and selected items arrangement
  $("#required").data("kendoMultiSelect").wrapper.addClass("myClass");

  function onSelect(e) {
    setTimeout(function() {
      // scroll the selected items' container to its bottom
      var container = e.sender.wrapper.children(".k-multiselect-wrap");
      container.scrollTop(container[0].scrollHeight);
    });
  }
</script>
```

## See Also

* [MultiSelect JavaScript API Reference](/api/javascript/ui/multiselect)
* [Cascade from DropDownList]({% slug howto_cascade_froma_dropdownlist_multiselect %})
* [Filter Values in Widgets Sharing the Same Data]({% slug howto_filter_valuesin_widgetswith_shared_data_multiselect %})
* [Preselect Items Using MVVM Binding]({% slug howto_preselect_items_byusing_mvvm_binding_multiselect %})
* [Select All Values with Single Selection]({% slug howto_select_allvalues_witha_single_selection_multiselect %})
* [Use MultiSelect with Bootstrap Modal Window]({% slug howto_use_multiselect_with_bootstrap_modal_window_multiselect %})
* [Wire Blur Event of the Filter Input]({% slug howto_wire_blur_event_ofthe_filtеr_input_multiselect %})
